import { describe, it, expect } from "vitest";
import { convertTextRequests } from "../textToPath";
import { validateDesign } from "@/lib/geometry/validate";

const DIMS = { productType: "bracelet" as const, lengthMm: 160, widthMm: 15, thicknessMm: 1.5 };

const svgWith = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 15"><g id="cutouts">${inner}</g></svg>`;

describe("text-to-path with auto-bridging", () => {
  it("converts a Hebrew name with closed letters into paths that pass V3 (no falling islands)", async () => {
    // "סם" — שתי אותיות עם קונטור סגור; בלי גישור האמצע היה נופל
    const raw = svgWith(`<text-request content="סם" x="80" y="7.5" height="6" align="middle"/>`);
    const converted = await convertTextRequests(raw, DIMS);
    expect(converted).not.toContain("text-request");
    expect(converted).toContain("<path");
    const { report } = validateDesign(converted, DIMS);
    const v3 = report.checks.find((c) => c.check === "V3")!;
    expect(v3.status).toBe("pass");
    const v2 = report.checks.find((c) => c.check === "V2")!;
    expect(v2.status).toBe("pass");
  });

  it("converts Latin text with counters (O, A)", async () => {
    const raw = svgWith(`<text-request content="OA" x="80" y="7.5" height="6" align="middle"/>`);
    const converted = await convertTextRequests(raw, DIMS);
    const { report } = validateDesign(converted, DIMS);
    expect(report.checks.find((c) => c.check === "V3")!.status).toBe("pass");
  });

  it("leaves SVG without text-request untouched", async () => {
    const raw = svgWith(`<circle cx="80" cy="7.5" r="3"/>`);
    expect(await convertTextRequests(raw, DIMS)).toBe(raw);
  });

  it("drops malformed text-request elements", async () => {
    const raw = svgWith(`<text-request content="" x="80"/><circle cx="80" cy="7.5" r="3"/>`);
    const converted = await convertTextRequests(raw, DIMS);
    expect(converted).not.toContain("text-request");
  });
});
