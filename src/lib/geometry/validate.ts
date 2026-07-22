import { he } from "@/i18n/he";
import { FAB, resolveFab, type ProductType } from "@/lib/fabrication.config";
import { normalizeSvg, ContractViolation, type NormalizedDesign } from "./normalize";
import {
  union, difference, intersection, offset, morphologicalOpen,
  multiPolygonArea, polygonArea, ringCentroid, ringBBoxRadius, rectPolygon,
} from "./poly";
import type {
  CheckResult, CheckStatus, ValidationReport, MultiPolygon, ValidationLocation,
} from "./types";

// מנוע הוולידציה — סעיף 7 במפרט. רץ בצד שרת על ה-SVG המנורמל.
// בדיקות שלא בשלב 1 (TODO): עיוות ערגול, חוזק, פיצוי התארכות.

export interface DesignDims {
  productType: ProductType;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
}

export interface ValidationOutcome {
  report: ValidationReport;
  normalized: NormalizedDesign | null;
}

const AREA_EPS = 1e-4;

function centroidLocations(mp: MultiPolygon): ValidationLocation[] {
  return mp.map((poly) => {
    const [x, y] = ringCentroid(poly[0]);
    return { x, y, r: ringBBoxRadius(poly[0]) };
  });
}

function aggregate(checks: CheckResult[]): CheckStatus {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  return "pass";
}

function emptyMetrics(dims: DesignDims) {
  return {
    stripAreaMm2: dims.lengthMm * dims.widthMm,
    cutAreaMm2: 0,
    openAreaPct: 0,
    estWeightGrams: 0,
  };
}

/** ולידציה מלאה של SVG גולמי. V1 (חוזה) קודם — אם נכשל, שאר הבדיקות לא רצות. */
export function validateDesign(rawSvg: string, dims: DesignDims): ValidationOutcome {
  let normalized: NormalizedDesign;
  try {
    normalized = normalizeSvg(rawSvg, dims.lengthMm, dims.widthMm);
  } catch (e) {
    const message = e instanceof ContractViolation ? e.message : `SVG parsing failed: ${e instanceof Error ? e.message : e}`;
    return {
      normalized: null,
      report: {
        status: "fail",
        checks: [{
          check: "V1",
          status: "fail",
          message: he.checks.V1,
          details: message,
          locations: [],
        }],
        metrics: emptyMetrics(dims),
      },
    };
  }
  const report = validateNormalized(normalized, dims);
  return { normalized, report };
}

export function validateNormalized(n: NormalizedDesign, dims: DesignDims): ValidationReport {
  const fab = resolveFab(dims.thicknessMm, dims.productType);
  const L = dims.lengthMm, W = dims.widthMm;
  const strip: MultiPolygon = [rectPolygon(0, 0, L, W)];
  const cutUnion = n.cutUnion;
  const material = difference(strip, cutUnion);

  const checks: CheckResult[] = [];
  checks.push({ check: "V1", status: "pass", message: he.checks.V1, details: "SVG contract OK", locations: [] });

  // V2 — חומר רציף
  {
    const comps = material;
    if (comps.length !== 1) {
      const sorted = [...comps].sort((a, b) => polygonArea(b) - polygonArea(a));
      const islands = sorted.slice(1);
      checks.push({
        check: "V2", status: "fail", message: he.checks.V2,
        details: `Material splits into ${comps.length} disconnected components. ` +
          `Island centers (mm): ${islands.map((p) => { const c = ringCentroid(p[0]); return `(${c[0].toFixed(1)}, ${c[1].toFixed(1)})`; }).join(", ")}. ` +
          `Every part of the remaining material must be connected — add bridges.`,
        locations: centroidLocations(islands),
      });
    } else {
      checks.push({ check: "V2", status: "pass", message: he.checks.V2, details: "Material is a single connected body", locations: [] });
    }
  }

  // V3 — איי חומר בתוך cutout (טבעות פנימיות באיחוד החיתוכים)
  {
    const holeLocs: ValidationLocation[] = [];
    for (const poly of cutUnion) {
      for (let i = 1; i < poly.length; i++) {
        const [x, y] = ringCentroid(poly[i]);
        holeLocs.push({ x, y, r: ringBBoxRadius(poly[i]) });
      }
    }
    if (holeLocs.length > 0) {
      checks.push({
        check: "V3", status: "fail", message: he.checks.V3,
        details: `Found ${holeLocs.length} material island(s) fully surrounded by cutouts at (mm): ` +
          `${holeLocs.map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}. ` +
          `These islands will fall out when cut. Connect them to the body with bridges or remove them.`,
        locations: holeLocs,
      });
    } else {
      checks.push({ check: "V3", status: "pass", message: he.checks.V3, details: "No trapped material islands", locations: [] });
    }
  }

  // V4 — רוחב גשר מינימלי, מודע-כיוון. הכיפוף מותח את המתכת רק בציר X (ההיקף),
  // לכן רק גשר דק *בציר X* בסיכון להיקרע. פס דק בציר Y שרחב ב-X בטוח.
  // מודדים בכל גובה (scanline) את רצף המתכת האופקי; רצף קצר מ-minBridgeBend = סיכון.
  {
    const bendLocs = thinXBridges(material, fab.minBridgeBend, W);
    if (bendLocs.length > 0) {
      // הבחנה: עובר את מינימום החיתוך (1.5) אך לא את מינימום הערגול?
      const cutLocs = thinXBridges(material, fab.minBridgeCut, W);
      const passesCut = cutLocs.length === 0;
      const msg = passesCut ? he.checks.V4bend : he.checks.V4;
      checks.push({
        check: "V4", status: "fail", message: msg,
        details: `Material bridge too thin ALONG THE BENDING AXIS (X) — the required minimum is ${fab.minBridgeBend}mm ` +
          `(${dims.productType} roll-bending survival${passesCut ? `; it does pass the ${fab.minBridgeCut}mm clean-cut minimum, the problem is bend survival` : ""}). ` +
          `Narrow region(s) near (mm): ${bendLocs.slice(0, 8).map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}${bendLocs.length > 8 ? "…" : ""}. ` +
          `Widen the metal between horizontally-adjacent cutouts (a band thin only in Y but long in X is fine).`,
        locations: bendLocs,
      });
    } else {
      checks.push({ check: "V4", status: "pass", message: he.checks.V4, details: `All X-direction bridges ≥ ${fab.minBridgeBend}mm`, locations: [] });
    }
  }

  // V5 — גודל פתח מינימלי (erosion של כל cutout ברדיוס minHole/2)
  {
    const locs: ValidationLocation[] = [];
    for (const cut of n.cutouts) {
      for (const poly of cut) {
        const eroded = offset([poly], -fab.minHole / 2);
        if (multiPolygonArea(eroded) < AREA_EPS) {
          const [x, y] = ringCentroid(poly[0]);
          locs.push({ x, y, r: ringBBoxRadius(poly[0]) });
        }
      }
    }
    if (locs.length > 0) {
      checks.push({
        check: "V5", status: "fail", message: he.checks.V5,
        details: `${locs.length} cutout(s) smaller than the minimum opening ${fab.minHole}mm at (mm): ` +
          `${locs.map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}. Enlarge or remove them.`,
        locations: locs,
      });
    } else {
      checks.push({ check: "V5", status: "pass", message: he.checks.V5, details: `All cutouts ≥ ${fab.minHole}mm`, locations: [] });
    }
  }

  // V6 — רוחב חריץ מינימלי (אזורים צרים בתוך cutout גדול)
  {
    const locs: ValidationLocation[] = [];
    for (const cut of n.cutouts) {
      for (const poly of cut) {
        const eroded = offset([poly], -fab.minHole / 2);
        if (multiPolygonArea(eroded) < AREA_EPS) continue; // כבר נתפס ב-V5
        // "חריץ" = תעלה צרה בין דפנות בתוך cutout. לצורה קמורה אין חריץ פנימי —
        // ההצטמצמות שלה היא רק הזנב המחודד (נשלט ע"י V5 בגודל ו-V9 בחדות). דלג.
        if (poly.length === 1 && isConvexRing(poly[0])) continue;
        const opened = morphologicalOpen([poly], fab.minSlot / 2);
        const lost = difference([poly], opened).filter((p) => polygonArea(p) > 0.25);
        for (const p of lost) {
          const [x, y] = ringCentroid(p[0]);
          locs.push({ x, y, r: ringBBoxRadius(p[0]) });
        }
      }
    }
    if (locs.length > 0) {
      checks.push({
        check: "V6", status: "warn", message: he.checks.V6,
        details: `Slot regions narrower than ${fab.minSlot}mm at (mm): ` +
          `${locs.map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}. Narrow slots may burn or distort.`,
        locations: locs,
      });
    } else {
      checks.push({ check: "V6", status: "pass", message: he.checks.V6, details: `All slots ≥ ${fab.minSlot}mm`, locations: [] });
    }
  }

  // V7 — שוליים (פסי edgeMargin לאורך השפות, endMargin ליד הקצוות)
  {
    const frames: MultiPolygon = [
      rectPolygon(0, 0, L, fab.edgeMargin),                    // שפה ארוכה y=0
      rectPolygon(0, W - fab.edgeMargin, L, W),                // שפה ארוכה y=W
      rectPolygon(0, 0, fab.endMargin, W),                     // קצה פתוח x=0
      rectPolygon(L - fab.endMargin, 0, L, W),                 // קצה פתוח x=L
    ];
    const overlap = intersection(cutUnion, frames);
    const big = overlap.filter((p) => polygonArea(p) > AREA_EPS);
    if (big.length > 0) {
      checks.push({
        check: "V7", status: "fail", message: he.checks.V7,
        details: `Cutouts intrude into the solid margins (edge margin ${fab.edgeMargin}mm along both long edges, ` +
          `end margin ${fab.endMargin}mm near both open ends) at (mm): ` +
          `${big.map((p) => { const c = ringCentroid(p[0]); return `(${c[0].toFixed(1)}, ${c[1].toFixed(1)})`; }).join(", ")}. ` +
          `Keep these zones completely solid.`,
        locations: centroidLocations(big),
      });
    } else {
      checks.push({ check: "V7", status: "pass", message: he.checks.V7, details: `Margins are solid (edge ${fab.edgeMargin}mm, end ${fab.endMargin}mm)`, locations: [] });
    }
  }

  // V8 — אחוז שטח פתוח
  const stripArea = L * W;
  const cutArea = multiPolygonArea(cutUnion);
  const openPct = (cutArea / stripArea) * 100;
  {
    if (openPct > fab.maxOpenAreaFailPct) {
      checks.push({
        check: "V8", status: "fail", message: he.checks.V8fail,
        details: `Open area is ${openPct.toFixed(1)}% — above the hard roll-bending ceiling of ${fab.maxOpenAreaFailPct}%. Reduce cutout area.`,
        locations: [],
      });
    } else if (openPct > fab.maxOpenAreaWarnPct) {
      checks.push({
        check: "V8", status: "warn", message: he.checks.V8warn,
        details: `Open area is ${openPct.toFixed(1)}% — above the conservative ${fab.maxOpenAreaWarnPct}% recommendation.`,
        locations: [],
      });
    } else {
      checks.push({ check: "V8", status: "pass", message: he.checks.V8warn, details: `Open area ${openPct.toFixed(1)}%`, locations: [] });
    }
  }

  // V9 — פינות חדות. מדיניות (לפי גל, ומאושרת פיזיקלית לפליז מחושל בכיפוף חד-פעמי):
  // חוד של *חור* אינו מסוכן (בכל כיוון) — פליז רך מאוד ומתיחת הכיפוף (~2.5%) הרבה
  // מתחת להתארכות הקריעה גם עם ריכוז מאמצים. מה שמסוכן הוא חוד *מתכת* דק וחשוף —
  // וזה נתפס ע"י V10 (פרט חומר מינימלי) בכל כיוון. לכן V9 עצמו אינו מסמן.
  {
    checks.push({
      check: "V9", status: "pass", message: he.checks.V9,
      details: "Sharp cutout (hole) corners are not a defect for annealed brass under a single roll-bend; thin exposed metal tips are covered by V10.",
      locations: [],
    });
  }

  // V10 — אלמנט מינימלי (פתיחה של material ברדיוס minFeature/2)
  {
    const r = fab.minFeature / 2;
    const opened = morphologicalOpen(material, r);
    const lost = difference(material, opened).filter((p) => polygonArea(p) > 0.25);
    if (lost.length > 0) {
      checks.push({
        check: "V10", status: "warn", message: he.checks.V10,
        details: `Free-standing material features thinner than ${fab.minFeature}mm at (mm): ` +
          `${lost.map((p) => { const c = ringCentroid(p[0]); return `(${c[0].toFixed(1)}, ${c[1].toFixed(1)})`; }).join(", ")}.`,
        locations: centroidLocations(lost),
      });
    } else {
      checks.push({ check: "V10", status: "pass", message: he.checks.V10, details: `All features ≥ ${fab.minFeature}mm`, locations: [] });
    }
  }

  const materialArea = multiPolygonArea(material);
  const estWeightGrams = (materialArea * dims.thicknessMm / 1000) * FAB.brassDensityGcm3;

  return {
    status: aggregate(checks),
    checks,
    metrics: {
      stripAreaMm2: stripArea,
      cutAreaMm2: cutArea,
      openAreaPct: openPct,
      estWeightGrams,
    },
  };
}

type Pt = [number, number];

/** האם טבעת קמורה? (כל הפניות באותו כיוון, עם סובלנות לרעש דגימה). צורה קמורה
 *  כמו אליפסה/מלבן אין בה חריץ פנימי — רק התכנסות טבעית של הגבול. */
function isConvexRing(ring: readonly Pt[]): boolean {
  const n = ring.length;
  if (n < 4) return true;
  let pos = 0, neg = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], c = ring[(i + 2) % n];
    const e1x = b[0] - a[0], e1y = b[1] - a[1];
    const e2x = c[0] - b[0], e2y = c[1] - b[1];
    const l1 = Math.hypot(e1x, e1y), l2 = Math.hypot(e2x, e2y);
    if (l1 < 1e-9 || l2 < 1e-9) continue;
    const cross = (e1x * e2y - e1y * e2x) / (l1 * l2);
    if (cross > 0.05) pos++;
    else if (cross < -0.05) neg++;
  }
  return pos === 0 || neg === 0;
}

/** חיתוכי scanline אופקי בגובה y עם כל הצלעות של material — מוחזרים ערכי x ממוינים.
 *  זוגות עוקבים [x0,x1],[x2,x3]... הם רצפי המתכת (כלל even-odd). */
function scanlineXs(material: MultiPolygon, y: number): number[] {
  const xs: number[] = [];
  for (const poly of material) {
    for (const ring of poly) {
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const a = ring[i], b = ring[(i + 1) % n];
        const ay = a[1], by = b[1];
        // הצלע חוצה את הקו y (חצי-פתוח כדי לא לספור קודקוד פעמיים)
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          const t = (y - ay) / (by - ay);
          xs.push(a[0] + (b[0] - a[0]) * t);
        }
      }
    }
  }
  xs.sort((p, q) => p - q);
  return xs;
}

/** גשרים דקים בציר X: בכל scanline מחפשים רצף מתכת אופקי קצר מ-minWidth.
 *  אשכולות נקודות סמוכות מאוחדים לאזור אחד. פס דק בציר Y (רחב ב-X) לא נתפס. */
function thinXBridges(material: MultiPolygon, minWidth: number, W: number): ValidationLocation[] {
  const step = 0.2;
  const raw: { x: number; y: number; w: number }[] = [];
  for (let y = step / 2; y < W; y += step) {
    const xs = scanlineXs(material, y);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const w = xs[k + 1] - xs[k];
      if (w > 1e-6 && w < minWidth) raw.push({ x: (xs[k] + xs[k + 1]) / 2, y, w });
    }
  }
  // אשכול: מיזוג נקודות במרחק < minWidth ב-X ו-< 1.5 מ"מ ב-Y
  const clusters: { x: number; y: number; n: number; minW: number }[] = [];
  for (const p of raw) {
    const c = clusters.find((c) => Math.abs(c.x - p.x) < Math.max(minWidth, 1) && Math.abs(c.y - p.y) < 1.5);
    if (c) {
      c.x = (c.x * c.n + p.x) / (c.n + 1);
      c.y = (c.y * c.n + p.y) / (c.n + 1);
      c.n += 1;
      c.minW = Math.min(c.minW, p.w);
    } else {
      clusters.push({ x: p.x, y: p.y, n: 1, minW: p.w });
    }
  }
  // סינון רעש: אשכול חייב להתפרש על לפחות ~0.6 מ"מ בגובה (3 scanlines)
  return clusters.filter((c) => c.n >= 3).map((c) => ({ x: c.x, y: c.y, r: 1.5 }));
}

