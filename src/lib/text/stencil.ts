import opentype from "opentype.js";
import { FONT_BASE64 } from "./fontData";
import { samplePathToRings, ringToPathD } from "@/lib/geometry/paths";
import { union, difference, intersection, ringArea, multiPolygonArea, rectPolygon } from "@/lib/geometry/poly";
import { resolveFab } from "@/lib/fabrication.config";
import type { DesignDims } from "@/lib/geometry/validate";
import type { MultiPolygon, Ring } from "@/lib/geometry/types";

// סעיף 6.4: המרת <text-request content x y height align/> לנתיבי אותיות.
// פונט: Secular One (עברי+לטיני, OFL). לא נמצא פונט סטנסיל עברי חופשי מתאים,
// לכן ממומש הגישור האוטומטי מהמפרט: לכל קונטור פנימי (counter של אות כמו ם/O)
// נוספים שני גשרים אנכיים ברוחב minBridgeCut שמחברים את ה"אי" לחומר שמסביב.

let cachedFont: opentype.Font | null = null;

function getFont(): opentype.Font {
  if (cachedFont) return cachedFont;
  const bin = Uint8Array.from(atob(FONT_BASE64), (c) => c.charCodeAt(0));
  cachedFont = opentype.parse(bin.buffer);
  return cachedFont;
}

const TEXT_REQUEST_RE = /<text-request\b([^>]*?)\/?>(?:<\/text-request>)?/gi;

function attr(attrsStr: string, name: string): string | null {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(attrsStr);
  return m ? m[1] : null;
}

const HEBREW_RE = /[֐-׿]/;

export async function renderTextRequests(svg: string, dims: DesignDims): Promise<string> {
  const fab = resolveFab(dims.thicknessMm, dims.productType);
  return svg.replace(TEXT_REQUEST_RE, (_m, attrsStr: string) => {
    const content = attr(attrsStr, "content") ?? "";
    const x = parseFloat(attr(attrsStr, "x") ?? "NaN");
    const y = parseFloat(attr(attrsStr, "y") ?? "NaN");
    const height = parseFloat(attr(attrsStr, "height") ?? "NaN");
    const align = (attr(attrsStr, "align") ?? "middle") as "start" | "middle" | "end";
    if (!content.trim() || !isFinite(x) || !isFinite(y) || !isFinite(height) || height <= 0) {
      // בקשה לא תקינה — מסירים; הוולידציה תמשיך על שאר העיצוב
      return "";
    }
    const mp = textToPolygons(content.trim(), x, y, height, align, fab.minBridgeCut);
    return mp
      .map((poly) => `<path d="${poly.map((r) => ringToPathD(r)).join("")}" fill="black"/>`)
      .join("");
  });
}

/** טקסט → פוליגונים בקואורדינטות מ"מ, כולל גישור קונטורים פנימיים */
export function textToPolygons(
  text: string,
  x: number,
  y: number,
  heightMm: number,
  align: "start" | "middle" | "end",
  bridgeWidthMm: number,
): MultiPolygon {
  const font = getFont();
  // עברית: opentype.js לא מבצע bidi — הופכים סדר תווים למחרוזת RTL
  const logical = HEBREW_RE.test(text) ? [...text].reverse().join("") : text;

  const upm = font.unitsPerEm;
  const capHeight = (font.tables.os2?.sCapHeight as number | undefined) || upm * 0.7;
  const fontSize = (heightMm * upm) / capHeight;

  const widthUnits = font.getAdvanceWidth(logical, fontSize);
  let startX = x;
  if (align === "middle") startX = x - widthUnits / 2;
  else if (align === "end") startX = x - widthUnits;

  // y = מרכז אנכי של הטקסט → baseline
  const baseline = y + heightMm / 2;
  const otPath = font.getPath(logical, startX, baseline, fontSize, { kerning: true });
  const d = otPath.toPathData(3);
  if (!d) return [];

  const subs = samplePathToRings(d);
  // גליפים: טבעות בכיוון הדומיננטי = מילוי, הפוכות = counters
  const rings = subs.map((s) => s.ring).filter((r) => r.length >= 3);
  if (rings.length === 0) return [];
  const areas = rings.map(ringArea);
  const total = areas.reduce((s, a) => s + a, 0);
  const dominant = Math.sign(total) || 1;
  const solids: MultiPolygon[] = [];
  const holes: { ring: Ring; bbox: [number, number, number, number] }[] = [];
  for (let i = 0; i < rings.length; i++) {
    if (Math.sign(areas[i]) === dominant) solids.push([[rings[i]]]);
    else holes.push({ ring: rings[i], bbox: bboxOf(rings[i]) });
  }
  if (solids.length === 0) return [];
  let glyphs = difference(
    union(...solids),
    holes.length ? union(...holes.map((h) => [[[...h.ring].reverse()]] as MultiPolygon)) : [],
  );

  // גישור: לכל קונטור פנימי — שני פסים אנכיים ברוחב הגשר, שמוסרים מהחיתוך
  // ומחברים את האי לחומר. הפסים נחתכים רק בתחום האנכי של האות המכילה.
  for (const h of holes) {
    const [hx0, , hx1] = h.bbox;
    const w = hx1 - hx0;
    const cx = (hx0 + hx1) / 2;
    const offsets = w > bridgeWidthMm * 4 ? [cx - w / 4, cx + w / 4] : [cx];
    const strips: MultiPolygon = offsets.map((sx) => rectPolygon(
      sx - bridgeWidthMm / 2, -1e4, sx + bridgeWidthMm / 2, 1e4,
    ));
    // מגבילים את הפס לאזור סביב החור בלבד (לא לחתוך אותיות שכנות מעל/מתחת)
    const [, hy0, , hy1] = h.bbox;
    const bounded = intersection(strips, [rectPolygon(hx0 - bridgeWidthMm, hy0 - heightMm, hx1 + bridgeWidthMm, hy1 + heightMm)]);
    glyphs = difference(glyphs, bounded);
  }

  return glyphs.filter((p) => multiPolygonArea([p]) > 0.01);
}

function bboxOf(ring: Ring): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [px, py] of ring) {
    if (px < x0) x0 = px;
    if (py < y0) y0 = py;
    if (px > x1) x1 = px;
    if (py > y1) y1 = py;
  }
  return [x0, y0, x1, y1];
}
