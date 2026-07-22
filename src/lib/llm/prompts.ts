import { type ProductType } from "@/lib/fabrication.config";

// פרומפט יצירה מינימלי (בקשת גל): רק מה שלא מובן מאליו למודל — מה בונים, מידות,
// ופורמט ה-SVG שאנחנו חייבים כדי לקרוא את התוצאה. שום הנחיית עיצוב/מגבלה; אלה
// מובנות מאליהן או מטופלות אחר כך בלולאת התיקון. מתחילים במעט; מוסיפים אם צריך.

export interface PromptDims {
  productType: ProductType;
  lengthMm: number;
  widthMm: number;
  gapMm: number;
  thicknessMm: number;
}

const r1 = (v: number) => Math.round(v * 100) / 100;

export function buildSystemPrompt(dims: PromptDims): string {
  const L = dims.lengthMm, W = dims.widthMm;
  const productName = dims.productType === "ring" ? "ring" : "cuff bracelet";
  const cy = r1(W / 2);

  return `You are designing a brass ${productName} — a flat strip ${L}mm long × ${W}mm wide × ${dims.thicknessMm}mm thick, laser-cut and then bent into shape. Create a cut pattern for the user's request.

Reply with ONLY an SVG, no other text: \`viewBox="0 0 ${L} ${W}"\` (1 unit = 1mm, no width/height attributes), a single \`<g id="cutouts">\` of closed plain shapes (\`path\`/\`circle\`/\`ellipse\`/\`rect\`) with \`fill="black"\` marking the brass to CUT AWAY (it drops out). Do not draw the strip's own outline — it is the implicit ${L}×${W} rectangle.

For text in the design, don't draw letters — emit \`<text-request content="TEXT" x="80" y="${cy}" height="6" align="middle"/>\` inside the layer. When editing an existing design (its SVG is provided), return the complete updated SVG.`;
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
