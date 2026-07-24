import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { decodeDataUrl } from "@/lib/db/storage";
import { generateRenderPng } from "@/lib/llm/imagegen";
import { vectorizeImageDebug } from "@/lib/vectorizer";
import type { LlmImage } from "@/lib/llm/core";

// בק־אופיס: מריץ את כל הצינור עם אבחון מלא ומחזיר את כל השלבים והקבצים.
// לא שומר גרסה — נועד לתכנון/דיבוג בלבד. מקבל פרומפט או תמונה (או שניהם).

export const maxDuration = 300;

const schema = z.object({
  prompt: z.string().max(4000).optional(),
  image: z.object({ dataUrl: z.string().max(8_000_000) }).nullable().optional(),
  heightMm: z.number().min(1).max(100).default(15),
  colorKey: z.enum(["warm", "dark", "saturation", "auto"]).default("auto"),
});

const ALLOWED_MEDIA = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    if (!body.prompt && !body.image) {
      throw new ApiError("bad_request", "Provide a prompt or an image", 400);
    }

    let renderDataUrl: string | null = null;
    let renderModel: string | null = null;
    let bytes: Uint8Array;
    let mediaType: string;

    if (body.image) {
      // מסלול תמונה: הקלט הוא כבר ההדמיה.
      const dec = decodeDataUrl(body.image.dataUrl);
      if (!ALLOWED_MEDIA.has(dec.mediaType)) throw new ApiError("bad_image", `Unsupported ${dec.mediaType}`, 400);
      bytes = dec.bytes;
      mediaType = dec.mediaType;
      renderDataUrl = body.image.dataUrl;
    } else {
      // מסלול פרומפט: מייצרים הדמיה קודם.
      let inspiration: LlmImage | null = null;
      const render = await generateRenderPng(body.prompt!, inspiration);
      renderDataUrl = `data:${render.mediaType};base64,${render.base64}`;
      renderModel = render.model;
      const dec = decodeDataUrl(renderDataUrl);
      bytes = dec.bytes;
      mediaType = dec.mediaType;
    }

    const result = await vectorizeImageDebug(bytes, mediaType, {
      heightMm: body.heightMm,
      // generated renders are always brass -> warm; uploads use the chosen key.
      colorKey: body.image ? body.colorKey : "warm",
    });

    return NextResponse.json({
      render: renderDataUrl ? { dataUrl: renderDataUrl, model: renderModel } : null,
      result,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
