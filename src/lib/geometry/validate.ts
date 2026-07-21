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

  // V4 — רוחב גשר מינימלי (פתיחה מורפולוגית של material ברדיוס minBridgeBend/2)
  {
    const r = fab.minBridgeBend / 2;
    const eroded = offset(material, -r);
    const opened = eroded.length > 0 ? offset(eroded, r) : [];
    const lost = difference(material, opened);
    const lostBig = lost.filter((p) => polygonArea(p) > 0.5);
    const splits = eroded.length > material.length;
    if (splits || lostBig.length > 0) {
      // הבחנה בין "לא עובר גם חיתוך" ל"עובר חיתוך אך לא ערגול"
      const rCut = fab.minBridgeCut / 2;
      const erodedCut = offset(material, -rCut);
      const openedCut = erodedCut.length > 0 ? offset(erodedCut, rCut) : [];
      const lostCut = difference(material, openedCut).filter((p) => polygonArea(p) > 0.5);
      const passesCut = !(erodedCut.length > material.length) && lostCut.length === 0;
      const msg = passesCut ? he.checks.V4bend : he.checks.V4;
      const locs = centroidLocations(lostBig.length > 0 ? lostBig : eroded.slice(1));
      checks.push({
        check: "V4", status: "fail", message: msg,
        details: `Bridge narrower than the required minimum ${fab.minBridgeBend}mm ` +
          `(${dims.productType} roll-bending survival${passesCut ? `; it does pass the ${fab.minBridgeCut}mm clean-cut minimum, the problem is bend survival` : ""}). ` +
          `Narrow region(s) near (mm): ${locs.map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}. ` +
          `Widen the material bridges between cutouts.`,
        locations: locs,
      });
    } else {
      checks.push({ check: "V4", status: "pass", message: he.checks.V4, details: `All bridges ≥ ${fab.minBridgeBend}mm`, locations: [] });
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

  // V9 — פינות פנימיות חדות + רדיוס עקמומיות
  {
    const locs = findSharpCorners(material, fab.minInnerCornerAngleDeg, fab.minInnerRadius);
    if (locs.length > 0) {
      checks.push({
        check: "V9", status: "warn", message: he.checks.V9,
        details: `Sharp internal corners (angle < ${fab.minInnerCornerAngleDeg}° or radius < ${fab.minInnerRadius}mm) at (mm): ` +
          `${locs.slice(0, 8).map((l) => `(${l.x.toFixed(1)}, ${l.y.toFixed(1)})`).join(", ")}${locs.length > 8 ? "…" : ""}. ` +
          `Round internal corners to at least ${fab.minInnerRadius}mm.`,
        locations: locs,
      });
    } else {
      checks.push({ check: "V9", status: "pass", message: he.checks.V9, details: "No sharp internal corners", locations: [] });
    }
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

/** זיהוי קודקודים חדים בקונטורים הפנימיים (גבולות ה-cutouts) של החומר */
function findSharpCorners(material: MultiPolygon, minAngleDeg: number, minRadiusMm: number): ValidationLocation[] {
  const locs: ValidationLocation[] = [];
  for (const poly of material) {
    // טבעות פנימיות בלבד = גבולות cutouts (הקונטור החיצוני הוא מלבן הרצועה)
    for (let ri = 1; ri < poly.length; ri++) {
      const ring = poly[ri];
      const nPts = ring.length;
      if (nPts < 3) continue;
      for (let i = 0; i < nPts; i++) {
        const p0 = ring[(i - 1 + nPts) % nPts];
        const p1 = ring[i];
        const p2 = ring[(i + 1) % nPts];
        const v1 = [p0[0] - p1[0], p0[1] - p1[1]];
        const v2 = [p2[0] - p1[0], p2[1] - p1[1]];
        const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
        if (l1 < 1e-9 || l2 < 1e-9) continue;
        const dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
        const angleDeg = (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
        if (angleDeg < minAngleDeg) {
          locs.push({ x: p1[0], y: p1[1], r: 1.5 });
          continue;
        }
        // קירוב רדיוס עקמומיות: פנייה משמעותית (>45° מהקו הישר) עם רדיוס קטן.
        // קטעים ישרים ארוכים משני צידי הקודקוד = פינה לא מעוגלת (רדיוס ~0);
        // בקשת דגומה הנקודות צפופות והרדיוס נמדד מהמעגל החוסם.
        if (angleDeg < 180 - 45) {
          const sampled = Math.min(l1, l2) < 0.25;
          const r = sampled ? circumradius(p0, p1, p2) : 0;
          if (r !== null && r < minRadiusMm * 0.8) {
            locs.push({ x: p1[0], y: p1[1], r: 1.5 });
          }
        }
      }
    }
  }
  // סינון כפילויות קרובות (בתוך 1 מ"מ)
  const filtered: ValidationLocation[] = [];
  for (const l of locs) {
    if (!filtered.some((f) => Math.hypot(f.x - l.x, f.y - l.y) < 1)) filtered.push(l);
  }
  return filtered;
}

function circumradius(a: [number, number], b: [number, number], c: [number, number]): number | null {
  const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(cross) < 1e-12) return null;
  return (ab * bc * ca) / (2 * Math.abs(cross));
}
