import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { getDesign, insertVersion } from "@/lib/db/designs";
import { supabaseAdmin } from "@/lib/db/supabase";
import { decodeDataUrl } from "@/lib/db/storage";
import { validateDesign, type DesignDims } from "@/lib/geometry/validate";
import { difference, rectPolygon } from "@/lib/geometry/poly";

// המרת תמונת עיצוב (רנדר מתכתי) ל-SVG דרך שירות ה-vectorizer שרץ על Hetzner.
// התמונה עוברת קונדישנינג (זיהוי מתכת לפי צבע + החלקה) ומוחזרת כ-cutouts,
// שנכנס לצינור הוולידציה/גיאומטריה הקיים ונשמר כגרסה.
// אורך הצמיד (length_mm) מתעדכן ליחס התמונה כדי שהייצוא וההדמיה יהיו עקביים.

export const maxDuration = 300;

const schema = z.object({
  designId: z.string().uuid(),
  image: z.object({ dataUrl: z.string().max(8_000_000) }),
  colorKey: z.enum(["warm", "dark", "saturation"]).default("warm"),
});

const ALLOWED_MEDIA = new Set(["image/png", "image/jpeg", "image/webp"]);

function vectorizerUrl(): string {
  return process.env.VECTORIZER_URL || "http://167.233.112.68:8000";
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    const design = await getDesign(body.designId);

    const { bytes, mediaType } = decodeDataUrl(body.image.dataUrl);
    if (!ALLOWED_MEDIA.has(mediaType)) {
      throw new ApiError("bad_image", `Unsupported image type ${mediaType}`, 400);
    }

    // קריאה לשירות ההמרה: התמונה + רוחב הצמיד הפיזי; width_mm נגזר מהחיתוך.
    const form = new FormData();
    form.append("image", new Blob([bytes as BlobPart], { type: mediaType }), "design.png");
    form.append("height_mm", String(Number(design.width_mm)));
    form.append("condition", "true");
    form.append("color_key", body.colorKey);

    const headers: Record<string, string> = {};
    if (process.env.VECTORIZER_TOKEN) {
      headers.Authorization = `Bearer ${process.env.VECTORIZER_TOKEN}`;
    }

    let resp: Response;
    try {
      resp = await fetch(`${vectorizerUrl()}/api/jobs`, { method: "POST", body: form, headers });
    } catch (e) {
      throw new ApiError("vectorizer_unreachable", `Could not reach vectorizer: ${(e as Error).message}`, 502);
    }

    const data = (await resp.json().catch(() => ({}))) as {
      status?: string;
      error_code?: string;
      error_message?: string;
      cutouts_svg?: string;
      input?: { width_mm?: number };
      metrics?: { iou?: number; vector_holes?: number; mean_contour_deviation_mm?: number };
    };

    if (!resp.ok || data.status !== "approved" || !data.cutouts_svg) {
      const reason = data.error_code || data.status || `http_${resp.status}`;
      throw new ApiError("vectorize_failed", `Vectorizer did not approve: ${reason}`, 422);
    }

    const derivedLength = Number(data.input?.width_mm ?? design.length_mm);

    // ולידציה/נרמול דרך המנוע הקיים, לפי אורך שנגזר מיחס התמונה.
    const vDims: DesignDims = {
      productType: design.product_type,
      lengthMm: derivedLength,
      widthMm: Number(design.width_mm),
      thicknessMm: Number(design.thickness_mm),
    };
    const { report, normalized } = validateDesign(data.cutouts_svg, vDims);

    // עדכון אורך הצמיד כך שהייצוא/תלת-ממד יתאימו לפרופורציות התמונה.
    if (derivedLength !== Number(design.length_mm)) {
      const sb = supabaseAdmin();
      const { error } = await sb
        .from("designs")
        .update({ length_mm: derivedLength, updated_at: new Date().toISOString() })
        .eq("id", design.id);
      if (error) throw new Error(error.message);
    }

    const version = await insertVersion({
      design_id: design.id,
      svg: normalized?.canonicalSvg ?? data.cutouts_svg,
      source: "generate",
      user_prompt: null,
      annotation_png_path: null,
      validation_report: report,
      validation_status: report.status,
    });

    const geometry = normalized
      ? {
          material: difference(
            [rectPolygon(0, 0, derivedLength, Number(design.width_mm))],
            normalized.cutUnion,
          ),
          cutUnion: normalized.cutUnion,
        }
      : null;

    return NextResponse.json({
      version,
      report,
      geometry,
      lengthMm: derivedLength,
      vectorizer: {
        iou: data.metrics?.iou,
        holes: data.metrics?.vector_holes,
        meanDeviationMm: data.metrics?.mean_contour_deviation_mm,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
