import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { FAB } from "@/lib/fabrication.config";
import { getDesign, insertVersion, countTodayGenerations } from "@/lib/db/designs";
import { uploadFile, decodeDataUrl } from "@/lib/db/storage";
import { runGeneratePipeline } from "@/lib/llm/pipeline";
import { LlmError, type LlmImage } from "@/lib/llm/core";
import { difference, rectPolygon } from "@/lib/geometry/poly";

// יצירה/עריכה דרך LLM + לולאת ולידציה — סעיף 6.
// קלט: designId (חובה — העיצוב כבר קיים), פרומפט, תמונות אופציונליות.
// בעריכה נשלח ה-SVG הנוכחי; תמונת סימונים נשמרת ב-Storage ונשלחת ל-LLM.

export const maxDuration = 300;

const imageSchema = z.object({
  kind: z.enum(["inspiration", "annotation"]),
  dataUrl: z.string().max(8_000_000), // ~6MB בפועל אחרי base64
});

const schema = z.object({
  designId: z.string().uuid(),
  userPrompt: z.string().min(1).max(4000),
  currentSvg: z.string().max(500_000).nullable().optional(),
  images: z.array(imageSchema).max(3).default([]),
});

const ALLOWED_MEDIA = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    const design = await getDesign(body.designId);

    // הגבלת קצב יומית לפרופיל
    const used = await countTodayGenerations(design.profile_id);
    if (used >= FAB.DAILY_GENERATION_LIMIT) {
      throw new ApiError("rate_limited", `Daily generation limit reached (${FAB.DAILY_GENERATION_LIMIT}/day)`, 429);
    }

    const images: LlmImage[] = [];
    let annotationPngPath: string | null = null;
    for (const img of body.images) {
      const { bytes, mediaType } = decodeDataUrl(img.dataUrl);
      if (!ALLOWED_MEDIA.has(mediaType)) {
        throw new ApiError("bad_image", `Unsupported image type ${mediaType}`, 400);
      }
      if (img.kind === "annotation") {
        annotationPngPath = `annotations/${design.id}/${Date.now()}.png`;
        await uploadFile(annotationPngPath, bytes, mediaType);
      }
      images.push({
        mediaType: mediaType as LlmImage["mediaType"],
        base64: img.dataUrl.slice(img.dataUrl.indexOf(",") + 1),
      });
    }

    const hasAnnotation = body.images.some((i) => i.kind === "annotation");
    const hasInspiration = body.images.some((i) => i.kind === "inspiration");

    const result = await runGeneratePipeline({
      dims: {
        productType: design.product_type,
        lengthMm: Number(design.length_mm),
        widthMm: Number(design.width_mm),
        gapMm: Number(design.gap_mm),
        thicknessMm: Number(design.thickness_mm),
      },
      userPrompt: body.userPrompt,
      currentSvg: body.currentSvg ?? null,
      images,
      hasAnnotation,
      hasInspiration,
    });

    // שמירת גרסה: pass/warn תמיד; fail נשמר רק אחרי שכל סבבי התיקון מוצו
    // (סבבי ביניים כושלים ממילא לא נשמרים — רק התוצאה הסופית מגיעה לכאן).
    const version = await insertVersion({
      design_id: design.id,
      svg: result.svg,
      source: result.source,
      user_prompt: body.userPrompt,
      annotation_png_path: annotationPngPath,
      validation_report: result.report,
      validation_status: result.report.status,
    });

    const geometry = result.normalized
      ? {
          material: difference(
            [rectPolygon(0, 0, Number(design.length_mm), Number(design.width_mm))],
            result.normalized.cutUnion,
          ),
          cutUnion: result.normalized.cutUnion,
        }
      : null;

    return NextResponse.json({
      version,
      report: result.report,
      geometry,
      repairRounds: result.repairRounds,
    });
  } catch (err) {
    if (err instanceof LlmError) {
      return handleRouteError(new ApiError("llm_error", err.message, err.retriable ? 502 : 500));
    }
    return handleRouteError(err);
  }
}
