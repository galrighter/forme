import { describe, it, expect } from "vitest";
import { validateDesign } from "../validate";
import { normalizeSvg } from "../normalize";
import { resolveFab } from "@/lib/fabrication.config";

const DIMS = { productType: "bracelet" as const, lengthMm: 160, widthMm: 15, thicknessMm: 1.5 };

const svg = (inner: string, L = 160, W = 15) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${W}"><g id="cutouts">${inner}</g></svg>`;

describe("resolveFab", () => {
  it("resolves 1.5mm bracelet values from the master table", () => {
    const f = resolveFab(1.5, "bracelet");
    expect(f.minBridgeBend).toBe(2.25);
    expect(f.minHole).toBe(2.0);
    expect(f.edgeMargin).toBe(3.0);
    expect(f.endMargin).toBe(5.0);
  });
  it("applies the ring edge margin override", () => {
    const f = resolveFab(1.5, "ring");
    expect(f.minBridgeBend).toBe(3.75);
    expect(f.edgeMargin).toBe(1.5);
  });
  it("interpolates between thicknesses", () => {
    const f = resolveFab(1.75, "bracelet");
    expect(f.minHole).toBeCloseTo(2.5, 5);
    expect(f.kerf).toBeCloseTo(0.135, 5);
  });
});

describe("normalizeSvg (contract V1)", () => {
  it("accepts a valid design and converts circles to paths", () => {
    const n = normalizeSvg(svg(`<circle cx="80" cy="7.5" r="3"/>`), 160, 15);
    expect(n.canonicalSvg).toContain(`<g id="cutouts">`);
    expect(n.canonicalSvg).toContain(`<path`);
    expect(n.cutouts).toHaveLength(1);
  });
  it("rejects width/height attributes", () => {
    expect(() =>
      normalizeSvg(`<svg width="160" viewBox="0 0 160 15"><g id="cutouts"><circle cx="80" cy="7.5" r="3"/></g></svg>`, 160, 15),
    ).toThrow(/width/);
  });
  it("rejects wrong viewBox", () => {
    expect(() => normalizeSvg(svg(`<circle cx="80" cy="7.5" r="3"/>`, 150, 15), 160, 15)).toThrow(/viewBox/);
  });
  it("rejects forbidden elements and open paths", () => {
    expect(() => normalizeSvg(svg(`<text x="1" y="1">hi</text>`), 160, 15)).toThrow(/not allowed|text content/);
    expect(() => normalizeSvg(svg(`<path d="M10 5 L20 5 L20 10" fill="black"/>`), 160, 15)).toThrow(/closed/);
  });
  it("rejects out-of-bounds cutouts", () => {
    expect(() => normalizeSvg(svg(`<circle cx="0" cy="7.5" r="3"/>`), 160, 15)).toThrow(/outside/);
  });
  it("strips markdown fences", () => {
    const n = normalizeSvg("```svg\n" + svg(`<circle cx="80" cy="7.5" r="3"/>`) + "\n```", 160, 15);
    expect(n.cutouts).toHaveLength(1);
  });
  it("unions overlapping cutouts", () => {
    const n = normalizeSvg(
      svg(`<circle cx="80" cy="7.5" r="3"/><circle cx="83" cy="7.5" r="3"/>`),
      160, 15,
    );
    expect(n.cutUnion).toHaveLength(1);
    expect(n.cutouts).toHaveLength(1);
  });
});

describe("validateDesign", () => {
  it("passes a clean staggered design", () => {
    // עיגולים r=1.25 (קוטר 2.5 ≥ minHole 2.0) בשורה עם מרווחים רחבים,
    // בתוך אזור העיצוב (שוליים 3 מ"מ, קצוות 5 מ"מ)
    const holes: string[] = [];
    for (let x = 20; x <= 140; x += 8) holes.push(`<circle cx="${x}" cy="7.5" r="1.25"/>`);
    const { report } = validateDesign(svg(holes.join("")), DIMS);
    const failed = report.checks.filter((c) => c.status === "fail");
    expect(failed).toEqual([]);
    expect(report.status === "pass" || report.status === "warn").toBe(true);
    expect(report.metrics.estWeightGrams).toBeGreaterThan(20);
    expect(report.metrics.estWeightGrams).toBeLessThan(40);
  });

  it("V2: detects disconnected material", () => {
    // חיתוך רוחבי מלא שמנתק את הרצועה לשניים — חורג מהשוליים בכוונה
    const { report } = validateDesign(svg(`<rect x="78" y="0" width="4" height="15"/>`), DIMS);
    expect(report.status).toBe("fail");
    expect(report.checks.find((c) => c.check === "V2")!.status).toBe("fail");
  });

  it("V3: detects a material island inside a cutout (annulus)", () => {
    // טבעת: עיגול חיצוני r=5 עם חור פנימי r=2.5 — האי ייפול
    const d = "M75 7.5 A5 5 0 1 0 85 7.5 A5 5 0 1 0 75 7.5 Z M77.5 7.5 A2.5 2.5 0 1 1 82.5 7.5 A2.5 2.5 0 1 1 77.5 7.5 Z";
    const { report } = validateDesign(svg(`<path d="${d}" fill="black"/>`), DIMS);
    const v3 = report.checks.find((c) => c.check === "V3")!;
    expect(v3.status).toBe("fail");
    expect(v3.locations.length).toBeGreaterThan(0);
    expect(v3.locations[0].x).toBeCloseTo(80, 0);
  });

  it("V4: detects a too-narrow bridge between two cutouts", () => {
    // שני מלבנים עם גשר של 1 מ"מ ביניהם (מתחת ל-2.25 הנדרש לצמיד)
    const { report } = validateDesign(
      svg(`<rect x="70" y="5" width="8" height="5"/><rect x="79" y="5" width="8" height="5"/>`),
      DIMS,
    );
    const v4 = report.checks.find((c) => c.check === "V4")!;
    expect(v4.status).toBe("fail");
  });

  it("V4: does NOT fail a bridge thin only in Y (safe along the bend axis)", () => {
    // שני חורים מוערמים אנכית עם פס מתכת אופקי דק ביניהם (~1.6מ"מ ב-Y, רחב ב-X).
    // הכיפוף מותח רק ב-X, לכן הפס בטוח — אסור שיסומן ככשל V4.
    const { report } = validateDesign(
      svg(`<rect x="40" y="4" width="80" height="2.7"/><rect x="40" y="8.3" width="80" height="2.7"/>`),
      DIMS,
    );
    expect(report.checks.find((c) => c.check === "V4")!.status).toBe("pass");
  });

  it("V5: flags a hole smaller than minHole", () => {
    const { report } = validateDesign(svg(`<circle cx="80" cy="7.5" r="0.6"/>`), DIMS);
    expect(report.checks.find((c) => c.check === "V5")!.status).toBe("fail");
  });

  it("V7: flags cutouts inside margins", () => {
    // עיגול צמוד לשפה הארוכה (בתוך 3 מ"מ השוליים)
    const { report } = validateDesign(svg(`<circle cx="80" cy="2" r="1.5"/>`), DIMS);
    expect(report.checks.find((c) => c.check === "V7")!.status).toBe("fail");
  });

  it("V8: warns/fails on high open area", () => {
    // מלבן ענק באמצע — שטח פתוח גבוה
    const { report } = validateDesign(svg(`<rect x="6" y="4" width="148" height="7"/>`), DIMS);
    const v8 = report.checks.find((c) => c.check === "V8")!;
    expect(v8.status === "warn" || v8.status === "fail").toBe(true);
  });

  it("returns fail with V1 for non-SVG input", () => {
    const { report, normalized } = validateDesign("hello, not svg", DIMS);
    expect(report.status).toBe("fail");
    expect(normalized).toBeNull();
    expect(report.checks[0].check).toBe("V1");
  });

  it("V9: does NOT flag smooth rounded cutouts as sharp corners", () => {
    // אליפסות חלקות (קצוות מחודדים אך מעוגלים) — לא אמורות להיחשב פינות חדות
    const holes: string[] = [];
    for (let x = 20; x <= 140; x += 16) holes.push(`<ellipse cx="${x}" cy="7.5" rx="5" ry="2.5"/>`);
    const { report } = validateDesign(svg(holes.join("")), DIMS);
    expect(report.checks.find((c) => c.check === "V9")!.status).toBe("pass");
  });

  it("V9: flags a genuinely sharp angular notch", () => {
    // מלבן חיתוך עם פינות ישרות (90°, רדיוס ~0) — פינות פנימיות חדות אמיתיות
    const { report } = validateDesign(svg(`<rect x="76" y="5" width="8" height="5"/>`), DIMS);
    expect(report.checks.find((c) => c.check === "V9")!.status).toBe("warn");
  });
});
