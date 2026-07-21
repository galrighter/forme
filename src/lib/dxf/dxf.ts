import type { MultiPolygon, Ring } from "@/lib/geometry/types";

// כתיבת DXF ASCII ישירות (סעיף 10). פורמט AC1009 (R12) עם ישויות POLYLINE
// קלאסיות — הערה: המפרט מציין LWPOLYLINE, אך LWPOLYLINE אינה קיימת ב-R12;
// POLYLINE/VERTEX/SEQEND היא הצורה התקנית ב-R12 ונפתחת בכל תוכנת CAD
// (LibreCAD, ezdxf, AutoCAD). קשתות פינת המלבן מיוצגות ב-bulge מדויק.
// ללא פיצוי kerf (applyKerfCompensation=false — המכונה מפצה).

interface DxfVertex {
  x: number;
  y: number;
  bulge?: number;
}

const F = (v: number) => v.toFixed(4);

function polylineEntity(layer: string, vertices: DxfVertex[]): string {
  const lines: string[] = [
    "0", "POLYLINE",
    "8", layer,
    "66", "1",
    "70", "1", // closed
  ];
  for (const v of vertices) {
    lines.push("0", "VERTEX", "8", layer, "10", F(v.x), "20", F(v.y), "30", "0.0");
    if (v.bulge) lines.push("42", F(v.bulge));
  }
  lines.push("0", "SEQEND", "8", layer);
  return lines.join("\n");
}

/** מלבן הרצועה עם פינות מעוגלות ברדיוס r — קשתות bulge מדויקות (רבע עיגול) */
function roundedRectVertices(L: number, W: number, r: number): DxfVertex[] {
  const b = Math.tan(Math.PI / 8); // bulge לרבע עיגול (90°) בכיוון CCW
  return [
    { x: r, y: 0 },
    { x: L - r, y: 0, bulge: b },
    { x: L, y: r },
    { x: L, y: W - r, bulge: b },
    { x: L - r, y: W },
    { x: r, y: W, bulge: b },
    { x: 0, y: W - r },
    { x: 0, y: r, bulge: b },
  ];
}

export interface DxfInput {
  lengthMm: number;
  widthMm: number;
  outerCornerRadiusMm: number;
  /** הקונטורים הדגומים של איחוד ה-cutouts (סיבולת 0.05 מ"מ) */
  cutUnion: MultiPolygon;
}

/**
 * DXF מלא ביחידות מ"מ. ציר ה-Y הפוך מ-SVG (DXF הוא y-למעלה) כדי שהקובץ
 * ייראה ב-CAD כמו בסטודיו.
 */
export function buildDxf(input: DxfInput): string {
  const { lengthMm: L, widthMm: W } = input;
  const flipRing = (ring: Ring): DxfVertex[] => ring.map(([x, y]) => ({ x, y: W - y }));

  const entities: string[] = [];
  entities.push(polylineEntity("OUTLINE", roundedRectVertices(L, W, input.outerCornerRadiusMm)));
  for (const poly of input.cutUnion) {
    for (const ring of poly) {
      if (ring.length >= 3) entities.push(polylineEntity("CUTOUTS", flipRing(ring)));
    }
  }

  return [
    // HEADER
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1009",
    "9", "$INSBASE", "10", "0.0", "20", "0.0", "30", "0.0",
    "9", "$EXTMIN", "10", "0.0", "20", "0.0",
    "9", "$EXTMAX", "10", F(L), "20", F(W),
    "0", "ENDSEC",
    // TABLES — שכבות
    "0", "SECTION", "2", "TABLES",
    "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "OUTLINE", "70", "0", "62", "1", "6", "CONTINUOUS",
    "0", "LAYER", "2", "CUTOUTS", "70", "0", "62", "5", "6", "CONTINUOUS",
    "0", "ENDTAB",
    "0", "ENDSEC",
    // ENTITIES
    "0", "SECTION", "2", "ENTITIES",
    entities.join("\n"),
    "0", "ENDSEC",
    "0", "EOF",
  ].join("\n") + "\n";
}

/** SVG ייצוא לצפייה: החוזה + מלבן חיצוני מעוגל */
export function buildExportSvg(input: DxfInput, cutoutPathEls: string): string {
  const { lengthMm: L, widthMm: W, outerCornerRadiusMm: r } = input;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${L + 2} ${W + 2}">` +
    `<rect x="0" y="0" width="${L}" height="${W}" rx="${r}" ry="${r}" fill="none" stroke="red" stroke-width="0.1"/>` +
    `<g id="cutouts">${cutoutPathEls}</g></svg>`
  );
}
