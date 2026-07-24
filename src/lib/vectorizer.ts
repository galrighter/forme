import { ApiError } from "@/lib/api";
import { type DesignRow, type VersionRow, insertVersion } from "@/lib/db/designs";
import { supabaseAdmin } from "@/lib/db/supabase";
import { validateDesign, type DesignDims } from "@/lib/geometry/validate";
import { difference, rectPolygon } from "@/lib/geometry/poly";
import type { ValidationReport } from "@/lib/geometry/types";

// לקוח לשירות ה-vectorizer (רץ על Hetzner). מקבל תמונת רנדר ומחזיר cutouts SVG
// נקי ומוחלק. משותף ל-/api/vectorize (העלאה ידנית) ול-/api/generate (מסלול ה-AI).

export interface VectorizeResult {
  cutoutsSvg: string;
  widthMm: number;
  metrics: { iou?: number; holes?: number; meanDeviationMm?: number };
}

function vectorizerUrl(): string {
  return process.env.VECTORIZER_URL || "https://vec.rmjewel.com";
}

export async function vectorizeImage(
  bytes: Uint8Array,
  mediaType: string,
  opts: { heightMm: number; colorKey: "warm" | "dark" | "saturation" | "auto" },
): Promise<VectorizeResult> {
  const form = new FormData();
  form.append("image", new Blob([bytes as BlobPart], { type: mediaType }), "design.png");
  form.append("height_mm", String(opts.heightMm));
  form.append("condition", "true");
  form.append("color_key", opts.colorKey);

  const headers: Record<string, string> = {};
  if (process.env.VECTORIZER_TOKEN) headers.Authorization = `Bearer ${process.env.VECTORIZER_TOKEN}`;

  let resp: Response;
  try {
    resp = await fetch(`${vectorizerUrl()}/api/jobs`, { method: "POST", body: form, headers });
  } catch (e) {
    throw new ApiError("vectorizer_unreachable", `Could not reach vectorizer: ${(e as Error).message}`, 502);
  }

  const text = await resp.text();
  let data: {
    status?: string;
    error_code?: string;
    cutouts_svg?: string;
    input?: { width_mm?: number };
    metrics?: { iou?: number; vector_holes?: number; mean_contour_deviation_mm?: number };
  } = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      "vectorize_bad_response",
      `Vectorizer returned non-JSON (${resp.status} ${resp.headers.get("content-type")}): ${text.slice(0, 300)}`,
      502,
    );
  }

  if (!resp.ok || data.status !== "approved" || !data.cutouts_svg) {
    const reason = data.error_code || data.status || `http_${resp.status}`;
    throw new ApiError("vectorize_failed", `Vectorizer did not approve: ${reason}`, 422);
  }

  return {
    cutoutsSvg: data.cutouts_svg,
    widthMm: Number(data.input?.width_mm ?? 0),
    metrics: {
      iou: data.metrics?.iou,
      holes: data.metrics?.vector_holes,
      meanDeviationMm: data.metrics?.mean_contour_deviation_mm,
    },
  };
}

/** מריץ את ה-vectorizer במצב debug ומחזיר את כל האבחון (כולל בכשל) — לבק־אופיס. */
export async function vectorizeImageDebug(
  bytes: Uint8Array,
  mediaType: string,
  opts: { heightMm: number; colorKey: "warm" | "dark" | "saturation" | "auto" },
): Promise<Record<string, unknown>> {
  const form = new FormData();
  form.append("image", new Blob([bytes as BlobPart], { type: mediaType }), "design.png");
  form.append("height_mm", String(opts.heightMm));
  form.append("condition", "true");
  form.append("color_key", opts.colorKey);
  form.append("debug", "true");

  const headers: Record<string, string> = {};
  if (process.env.VECTORIZER_TOKEN) headers.Authorization = `Bearer ${process.env.VECTORIZER_TOKEN}`;

  let resp: Response;
  try {
    resp = await fetch(`${vectorizerUrl()}/api/jobs`, { method: "POST", body: form, headers });
  } catch (e) {
    return { __fetchError: (e as Error).message };
  }
  const text = await resp.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // surface the raw reply so the back-office shows what actually came back
    return { __status: resp.status, __contentType: resp.headers.get("content-type"), __body: text.slice(0, 2000) };
  }
}

export interface IngestResult {
  version: VersionRow;
  report: ValidationReport;
  geometry: { material: ReturnType<typeof difference>; cutUnion: unknown } | null;
  lengthMm: number;
}

/**
 * מריץ cutouts SVG שהתקבל מה-vectorizer דרך מנוע הוולידציה, מעדכן את אורך הצמיד
 * לפרופורציות שנגזרו, ושומר גרסה. משותף למסלול ההעלאה ולמסלול ה-AI.
 * renderPngPath (אם קיים) נשמר בתוך דוח הוולידציה כדי להציג את ההדמיה בלי שינוי סכימה.
 */
export async function ingestCutouts(opts: {
  design: DesignRow;
  cutoutsSvg: string;
  derivedLength: number;
  userPrompt: string | null;
  renderPngPath: string | null;
  metrics?: VectorizeResult["metrics"];
}): Promise<IngestResult> {
  const { design, cutoutsSvg, derivedLength } = opts;
  const lengthMm = derivedLength > 0 ? derivedLength : Number(design.length_mm);

  const vDims: DesignDims = {
    productType: design.product_type,
    lengthMm,
    widthMm: Number(design.width_mm),
    thicknessMm: Number(design.thickness_mm),
  };
  const { report, normalized } = validateDesign(cutoutsSvg, vDims);

  if (lengthMm !== Number(design.length_mm)) {
    const sb = supabaseAdmin();
    const { error } = await sb
      .from("designs")
      .update({ length_mm: lengthMm, updated_at: new Date().toISOString() })
      .eq("id", design.id);
    if (error) throw new Error(error.message);
  }

  const version = await insertVersion({
    design_id: design.id,
    svg: normalized?.canonicalSvg ?? cutoutsSvg,
    source: "generate",
    user_prompt: opts.userPrompt,
    annotation_png_path: null,
    // שומרים נתיב הדמיה + מדדי vectorizer בתוך הדוח (jsonb) — בלי מיגרציה. משמש ליומן הבק־אופיס.
    validation_report: { ...report, renderPngPath: opts.renderPngPath, vectorizer: opts.metrics ?? null },
    validation_status: report.status,
  });

  const geometry = normalized
    ? {
        material: difference(
          [rectPolygon(0, 0, lengthMm, Number(design.width_mm))],
          normalized.cutUnion,
        ),
        cutUnion: normalized.cutUnion,
      }
    : null;

  return { version, report, geometry, lengthMm };
}
