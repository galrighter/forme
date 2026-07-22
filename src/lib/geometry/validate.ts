import { he } from "@/i18n/he";
import { FAB, resolveFab, type ProductType } from "@/lib/fabrication.config";
import { normalizeSvg, ContractViolation, type NormalizedDesign } from "./normalize";
import {
  difference, offset,
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

  // V5 — גודל פתח מינימלי (erosion של כל cutout ברדיוס minHole/2). מדיניות גל:
  // minHole=0.5מ"מ בלבד. שאר המגבלות (גשר/חריץ/שוליים/שטח-פתוח/פינות/פרט) הוסרו —
  // ראו docs/REMOVED_CONSTRAINTS.md. סומכים על המודל; נחזיר אם ניתקל בבעיה.
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

  const stripArea = L * W;
  const cutArea = multiPolygonArea(cutUnion);
  const openPct = (cutArea / stripArea) * 100; // מוצג כמידע בלבד, לא נאכף
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
