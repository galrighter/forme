import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { getDesign } from "@/lib/db/designs";
import { decodeDataUrl, uploadFile } from "@/lib/db/storage";
import { vectorizeImage, ingestCutouts } from "@/lib/vectorizer";

// מסלול 1: העלאת תמונת עיצוב (רנדר מתכתי) והמרתה ל-SVG דרך שירות ה-vectorizer.
// התמונה עוברת קונדישנינג + החלקה, וה-cutouts נכנס לצינור הקיים ונשמר כגרסה.

export const maxDuration = 300;

const schema = z.object({
  designId: z.string().uuid(),
  image: z.object({ dataUrl: z.string().max(8_000_000) }),
  colorKey: z.enum(["warm", "dark", "saturation"]).default("warm"),
});

const ALLOWED_MEDIA = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, schema);
    const design = await getDesign(body.designId);

    const { bytes, mediaType } = decodeDataUrl(body.image.dataUrl);
    if (!ALLOWED_MEDIA.has(mediaType)) {
      throw new ApiError("bad_image", `Unsupported image type ${mediaType}`, 400);
    }

    // שומרים את התמונה שהועלתה כדי שאפשר יהיה להציג אותה לצד השרטוט.
    const renderPngPath = `renders/${design.id}/${Date.now()}.png`;
    await uploadFile(renderPngPath, bytes, mediaType);

    const { cutoutsSvg, widthMm, metrics } = await vectorizeImage(bytes, mediaType, {
      heightMm: Number(design.width_mm),
      colorKey: body.colorKey,
    });

    const { version, report, geometry, lengthMm } = await ingestCutouts({
      design,
      cutoutsSvg,
      derivedLength: widthMm,
      userPrompt: null,
      renderPngPath,
    });

    return NextResponse.json({ version, report, geometry, lengthMm, vectorizer: metrics });
  } catch (err) {
    return handleRouteError(err);
  }
}
