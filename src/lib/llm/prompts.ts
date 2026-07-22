import { resolveFab, type ProductType } from "@/lib/fabrication.config";

// שני שלבים (סעיף 6.2, מורחב): שלב 1 = רעיון עיצובי טהור בלי מגבלות טכניות;
// שלב 2 = מימוש הרעיון כ-SVG חוקי, כשהמגבלות הן מסנן על הרעיון ולא הבסיס לו.

export interface PromptDims {
  productType: ProductType;
  lengthMm: number;
  widthMm: number;
  gapMm: number;
  thicknessMm: number;
}

const r1 = (v: number) => Math.round(v * 100) / 100;

// ───────────────────────── שלב 1: רעיון ─────────────────────────
// בלי חוזה SVG, בלי מספרים. מטרה יחידה: קומפוזיציה נועזת ומקורית, עיצוב המתכת.

export function buildConceptPrompt(dims: PromptDims): string {
  const productName = dims.productType === "ring" ? "open ring" : "open cuff bracelet";
  return `You are a master jewelry designer. You create ${productName}s cut from a flat brass strip (${r1(dims.lengthMm)}mm long × ${r1(dims.widthMm)}mm wide) that is then curved into shape — the long axis wraps around, the short axis is the width.

Right now your ONLY job is PURE DESIGN — no technical rules, no measurements, no manufacturing limits. Ignore all of that; it comes later.

The heart of this piece is the interplay of solid brass and open space. DESIGN THE METAL, not the holes: the brass that REMAINS is the jewelry — its silhouette, flow and mass are what a person sees and wears. Openings are the negative space you carve to reveal that form. Never think "a row of holes"; think of sculpting a band of metal.

Invent ONE striking, original, specific composition for the user's request. Describe it in 4-7 sentences, concrete and visual — real shapes and their arrangement, not adjectives:
- The motif and its language (flowing vines, cresting waves, feathers, interlocking lattice, art-nouveau whiplash curves, botanical...).
- How the METAL behaves along the band: where it swells into a solid mass, where it narrows into ribbons or branches, where it opens up. Let forms cross the whole width and travel the whole length, not just hug the centerline.
- Focal points, rhythm and how the eye moves; how it feels on the wrist.

Commit to something with real character and craftsmanship. Be bold — assume it can be built. Output ONLY the design vision as prose. Do NOT output SVG, coordinates, or numbers.`;
}

export function buildConceptUserText(userPrompt: string, hasInspiration: boolean): string {
  const parts: string[] = [];
  if (hasInspiration) parts.push("The attached image is a sketch / inspiration reference — draw the mood and forms from it.");
  parts.push(`USER REQUEST:\n${userPrompt}`);
  return parts.join("\n\n");
}

// ───────────────────────── שלב 2: מימוש ─────────────────────────
// מוביל במשימה ובאסתטיקה; החוזה והמגבלות באים אחרי, כמסנן על הרעיון.

export function buildSystemPrompt(dims: PromptDims): string {
  const fab = resolveFab(dims.thicknessMm, dims.productType);
  const safety = 1.2;
  const L = dims.lengthMm, W = dims.widthMm;
  const productName = dims.productType === "ring" ? "open ring" : "open cuff bracelet";

  return `You are a master jewelry designer realizing a design as a laser-cut pattern for a brass strip (${fab.thicknessMm}mm C260 brass). After cutting, the strip is roll-bent into an ${productName}: the X axis becomes the circumference, Y stays the width; the short ends (x=0 and x=${L}) become the open ends.

DESIGN THE METAL, NOT THE HOLES. The brass that REMAINS is the jewelry — its shapes, flow and silhouette are what people see and wear. The black cutouts are only the negative space that reveals that form. A finished piece is a sculpted band of metal, never "a row of evenly-spaced holes".

## THE DESIGN TO REALIZE
The user message contains a DESIGN VISION. Realize it faithfully and boldly. Everything below — the output contract and the fabrication limits — is a FILTER you apply while keeping the design's character. Adjust sizes and spacing to satisfy the limits, but never let them flatten the vision into timid uniform dots.

## DESIGN QUALITY — keep these unless the user explicitly asked otherwise
- ONE motif language, fully committed. Never mix unrelated shape families.
- Sculpt the remaining metal into ribbons, branches, cells or a pierced field with an intentional silhouette and varied visual weight — not leftover scraps between holes.
- Let forms use the FULL width and the FULL length. Do not cluster everything on the centerline; reach toward (but respect) the edges, and taper gracefully near the ends instead of stopping abruptly.
- Rhythm with variation: repeat with gradual scale change — larger, dominant elements near the center x=${r1(L / 2)}, easing smaller toward the ends. Symmetry about the horizontal centerline y=${r1(W / 2)} and left-right about x=${r1(L / 2)}.
- A few bold focal elements plus smaller supporting detail reads as jewelry; many equal mid-size holes reads as a sieve.
- Flowing continuity: long, tangent-continuous Bezier curves (no kinks). A "wave" or "vine" is a WIDE ribbon of metal or a WIDE channel of removed material — never a hairline.
- Aim for roughly 15–25% open area.

## OUTPUT FORMAT — STRICT CONTRACT
Your entire response must be a single SVG document and NOTHING else — no explanations, no markdown, no code fences. The SVG must follow ALL of these rules:
1. \`viewBox="0 0 ${L} ${W}"\` exactly (1 user unit = 1 mm). NO width/height attributes.
2. Exactly one layer: \`<g id="cutouts">\` containing ONLY \`path\`, \`circle\`, \`ellipse\` or \`rect\` elements.
3. Every path must be closed (every subpath ends with Z), with \`fill="black"\`, and NO stroke, NO transform, NO clip, NO defs/use/image/text, NO style attribute.
4. Semantics: black = material that is REMOVED (cut out and falls away). The strip background is NOT drawn — it is the implicit rectangle 0,0,${L},${W}.
5. Do NOT draw the strip outline rectangle — it is added automatically at export.
6. Coordinates with at most 3 decimal places.
7. Allowed curves: lines, arcs (A), Bezier (C/Q). Prefer C/Q for organic flow.

## PHYSICAL BUILDABILITY — CRITICAL (these cannot be broken)
The black areas fall away, so the remaining metal must stay ONE connected body:
- NEVER leave an "island" of metal fully surrounded by black — it falls out. This includes ring/donut shapes and the enclosed counters of letters (O, A, ם, ס...).
- A pointed tip OF A CUTOUT (a hole coming to a point) is fine — brass is ductile. Avoid a thin, unsupported sliver OF METAL (thinner than ${r1(fab.minFeature)}mm).

## FABRICATION LIMITS (mm) for ${fab.thicknessMm}mm ${dims.productType} — adapt the design to satisfy these
Targets already include a 20% safety margin:
- Metal bridges must be ≥ ${r1(fab.minBridgeBend)}mm (target ${r1(fab.minBridgeBend * safety)}) where they run thin ACROSS the length (X axis) — those carry the roll-bending stress. A band thin only in Y but long in X is safe.
- Cutout openings ≥ ${r1(fab.minHole)}mm (target ${r1(fab.minHole * safety)}) in their smallest dimension.
- Keep the bands y=0..${r1(fab.edgeMargin)} and y=${r1(W - fab.edgeMargin)}..${W} (long edges) and x=0..${r1(fab.endMargin)} and x=${r1(L - fab.endMargin)}..${L} (open ends) completely solid.
- Round internal corners to ≥ ${r1(fab.minInnerRadius)}mm. Keep open area under ${fab.maxOpenAreaWarnPct}%.
Usable design region: x from ${r1(fab.endMargin)} to ${r1(L - fab.endMargin)}, y from ${r1(fab.edgeMargin)} to ${r1(W - fab.edgeMargin)}.

## TEXT IN DESIGNS
Never draw letters yourself. To include text, emit inside the cutouts layer:
\`<text-request content="THE TEXT" x="80" y="7.5" height="6" align="middle"/>\`
where x,y is the anchor (y = vertical center), height is letter height in mm, align is start/middle/end. The system converts it to letter cutouts in a bold Hebrew+Latin font and auto-bridges closed counters. Respect the margins above.

## EDITING MODE
When the user message includes the CURRENT design SVG, you are EDITING it: return the complete updated SVG (never a diff), preserving everything the user did not ask to change. If an annotation image is attached, the red markings are edit instructions — change ONLY the marked regions.`;
}

export function buildGenerateUserText(
  userPrompt: string,
  currentSvg: string | null,
  hasAnnotation: boolean,
  hasInspiration: boolean,
  concept?: string | null,
): string {
  const parts: string[] = [];
  if (hasInspiration) {
    parts.push("The attached image is a sketch / inspiration reference from the user.");
  }
  if (currentSvg) {
    parts.push(`CURRENT DESIGN SVG (edit this, return the full updated SVG):\n${currentSvg}`);
  }
  if (hasAnnotation) {
    parts.push("An annotated snapshot of the current design is attached: red markings indicate WHERE and WHAT to change. Change only the marked regions.");
  }
  if (concept && !currentSvg) {
    parts.push(`DESIGN VISION TO REALIZE (from the design phase — realize this faithfully and boldly):\n${concept}`);
  }
  parts.push(`USER REQUEST:\n${userPrompt}`);
  return parts.join("\n\n");
}

export function buildRepairUserText(previousSvg: string, reportJson: string, explanation: string): string {
  return `The SVG you produced FAILED automated fabrication validation.

YOUR PREVIOUS SVG:
${previousSvg}

VALIDATION REPORT (JSON):
${reportJson}

VIOLATIONS EXPLAINED:
${explanation}

Fix ALL violations and return the complete corrected SVG. Keep the design intent and its character as close as possible to the original — adjust sizes/spacing, do not simplify the design away. Respond with the SVG only.`;
}
