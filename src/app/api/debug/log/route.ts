import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { listRuns, type RunStagePaths } from "@/lib/db/runs";
import { signedUrl } from "@/lib/db/storage";

// בק־אופיס: יומן כל הרצות הצינור (מכל המסלולים) — הדמיה, שלבי ביניים, SVG, סטטוס
// ומדדים, כדי לאבחן בעיות מתלונות משתמשים ולכייל יחד את איכות ההמרה.

export const maxDuration = 60;

async function sign(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  try {
    return await signedUrl(path, 3600);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const rows = await listRuns(80);
    const items = await Promise.all(
      rows.map(async (r) => {
        const stages = (r.stage_paths ?? {}) as RunStagePaths;
        const [renderUrl, conditioned, overlay, difference, rendered] = await Promise.all([
          sign(r.render_path),
          sign(stages.conditioned),
          sign(stages.overlay),
          sign(stages.difference),
          sign(stages.rendered),
        ]);
        return {
          id: r.id,
          createdAt: r.created_at,
          source: r.source,
          productType: r.product_type,
          prompt: r.prompt,
          colorKey: r.color_key,
          status: r.status,
          error: r.error,
          durationMs: r.duration_ms,
          renderModel: r.render_model,
          renderUrl,
          stages: { conditioned, overlay, difference, rendered },
          svg: r.svg,
          metrics: r.metrics,
          debug: r.debug,
        };
      }),
    );
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
