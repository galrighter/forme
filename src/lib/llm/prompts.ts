import { resolveFab, type ProductType } from "@/lib/fabrication.config";

// פרומפט יצירה קצר וכללי (בקשת גל): הסבר טבעי + מגבלות מידה כלליות + פורמט
// SVG מינימלי הדרוש לקריאה — בלי טבלת מגבלות כבדה שחונקת יצירתיות. חריגות
// מטופלות אחר כך ע"י לולאת התיקון (עיבוי/עיגול/הגדלה תוך שמירת אופי העיצוב).

export interface PromptDims {
  productType: ProductType;
  lengthMm: number;
  widthMm: number;
  gapMm: number;
  thicknessMm: number;
}

const r1 = (v: number) => Math.round(v * 100) / 100;

export function buildSystemPrompt(dims: PromptDims): string {
  const fab = resolveFab(dims.thicknessMm, dims.productType);
  const L = dims.lengthMm, W = dims.widthMm;
  const productName = dims.productType === "ring" ? "open ring" : "open cuff bracelet";

  return `You are a talented jewelry designer. Design an ${productName} made from a single flat strip of ${fab.thicknessMm}mm C260 brass, produced ONLY by laser-cutting the flat strip and then roll-bending it into shape — no welding, no other processes. The strip is ${L}mm long and ${W}mm wide; when bent, the length wraps around and the width stays the width.

Design the METAL: the brass that REMAINS is the jewelry — its flowing shapes and silhouette are what people see and wear. The parts you cut away are open space that shapes it. Make something genuinely beautiful for the user's request, with forms that travel along the whole length and use the full width — not a row of little holes.

Output ONLY the laser-cut pattern as a single SVG and nothing else (no markdown, no explanation):
- \`viewBox="0 0 ${L} ${W}"\`, 1 unit = 1mm, no width/height attributes.
- One \`<g id="cutouts">\` containing closed shapes (\`path\`/\`circle\`/\`ellipse\`/\`rect\`) filled \`fill="black"\` = the brass that is CUT AWAY and falls out. Do NOT draw the strip outline — the strip is the implicit rectangle 0,0,${L},${W}. No stroke, transform, clip, defs, use, image, text, or style.
- Prefer smooth Bezier curves (C/Q) for organic flow. Every subpath closes with Z. Coordinates ≤ 3 decimals.

General guidance (approximate — exact sizes get fine-tuned automatically afterward, so favour beauty over caution):
- Keep ALL the remaining metal connected as one piece; never fully enclose metal by a cut (it would fall out) — no closed rings/donuts or enclosed letter centers.
- Leave a solid border of roughly ${r1(fab.edgeMargin)}mm along the two long edges and roughly ${r1(fab.endMargin)}mm at the two short ends.
- Keep metal ribbons and openings a sensible few mm across — no hairlines.

If the user wants text, don't draw letters; emit \`<text-request content="TEXT" x="80" y="7.5" height="6" align="middle"/>\` inside the cutouts layer (x,y = anchor, y = vertical center; align start/middle/end) and the system renders + auto-bridges it.

EDITING: if the user message includes a CURRENT design SVG, return the complete updated SVG (not a diff), changing only what was asked. If a red-annotated image is attached, treat the red marks as edit instructions for those regions only.`;
}

export function buildGenerateUserText(
  userPrompt: string,
  currentSvg: string | null,
  hasAnnotation: boolean,
  hasInspiration: boolean,
): string {
  const parts: string[] = [];
  if (hasInspiration) {
    parts.push("The attached image is a sketch / inspiration reference from the user — draw the mood and forms from it.");
  }
  if (currentSvg) {
    parts.push(`CURRENT DESIGN SVG (edit this, return the full updated SVG):\n${currentSvg}`);
  }
  if (hasAnnotation) {
    parts.push("An annotated snapshot of the current design is attached: red markings indicate WHERE and WHAT to change. Change only the marked regions.");
  }
  parts.push(`USER REQUEST:\n${userPrompt}`);
  return parts.join("\n\n");
}

// לולאת התיקון (סעיף 6.3): מקבלת את דוח הוולידציה ומבקשת תיקון ממוקד תוך
// שמירת אופי העיצוב — עיבוי גשרים דקים, הגדלת פתחים קטנים, עיגול, וכו'.
export function buildRepairUserText(previousSvg: string, reportJson: string, explanation: string): string {
  return `Your SVG is almost there but a few spots break the fabrication limits. Fix them WITHOUT changing the design's character — nudge sizes locally: thicken thin metal bridges, widen or merge openings that are too small, pull cutouts out of the solid margins, round sharp internal notches, connect anything that would fall out. Do not simplify or flatten the design.

YOUR PREVIOUS SVG:
${previousSvg}

VALIDATION REPORT (JSON):
${reportJson}

WHAT TO FIX:
${explanation}

Return the complete corrected SVG only.`;
}
