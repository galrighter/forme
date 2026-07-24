import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { FAB } from "@/lib/fabrication.config";
import { getDesign, countTodayGenerations } from "@/lib/db/designs";
import { uploadFile, decodeDataUrl } from "@/lib/db/storage";
import { generateRenderPng } from "@/lib/llm/imagegen";
import { LlmError, type LlmImage } from "@/lib/llm/core";
import { vectorizeImage, ingestCutouts } from "@/lib/vectorizer";

// יצירה במסלול ה-AI (מסלול 2): טקסט/השראה → מודל תמונה (רנדר של הצמיד) →
// קונדישנינג + vectorizer → cutouts SVG → צינור הוולידציה הקיים → גרסה.
// זה מחליף את היצירה הישירה טקסט→SVG (ש-LLM לא הצליח בה) — עכשיו דרך הדמיה.

export const maxDuration = 300;

const imageSchema = z.object({
  kind: z.enum(["inspiration", "annotation"]),
  dataUrl: z.string().max(8_000_000),
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

    const used = await countTodayGenerations(design.profile_id);
    if (used >= FAB.DAILY_GENERATION_LIMIT) {
      throw new ApiError("rate_limited", `Daily generation limit reached (${FAB.DAILY_GENERATION_LIMIT}/day)`, 429);
    }

    // תמונת השראה (אם צורפה) משמשת רפרנס למודל התמונה.
    let inspiration: LlmImage | null = null;
    for (const img of body.images) {
      const { mediaType } = decodeDataUrl(img.dataUrl);
      if (!ALLOWED_MEDIA.has(mediaType)) {
        throw new ApiError("bad_image", `Unsupported image type ${mediaType}`, 400);
      }
      if (img.kind === "inspiration" && !inspiration) {
        inspiration = {
          mediaType: mediaType as LlmImage["mediaType"],
          base64: img.dataUrl.slice(img.dataUrl.indexOf(",") + 1),
        };
      }
    }

    // 1) יצירת רנדר של הצמיד מהתיאור.
    const render = await generateRenderPng(body.userPrompt, inspiration);
    const renderBytes = decodeDataUrl(`data:${render.mediaType};base64,${render.base64}`).bytes;

    // 2) שמירת ההדמיה כדי להציג אותה לצד השרטוט.
    const renderPngPath = `renders/${design.id}/${Date.now()}.png`;
    await uploadFile(renderPngPath, renderBytes, render.mediaType);

    // 3) המרת ההדמיה ל-cutouts SVG נקי דרך ה-vectorizer.
    const { cutoutsSvg, widthMm, metrics } = await vectorizeImage(renderBytes, render.mediaType, {
      heightMm: Number(design.width_mm),
      colorKey: "warm",
    });

    // 4) ולידציה ושמירת גרסה דרך הצינור הקיים.
    const { version, report, geometry, lengthMm } = await ingestCutouts({
      design,
      cutoutsSvg,
      derivedLength: widthMm,
      userPrompt: body.userPrompt,
      renderPngPath,
      metrics,
    });

    return NextResponse.json({
      version,
      report,
      geometry,
      lengthMm,
      render: { model: render.model, dataUrl: `data:${render.mediaType};base64,${render.base64}` },
      vectorizer: metrics,
    });
  } catch (err) {
    if (err instanceof LlmError) {
      return handleRouteError(new ApiError("llm_error", err.message, err.retriable ? 502 : 500));
    }
    return handleRouteError(err);
  }
}
