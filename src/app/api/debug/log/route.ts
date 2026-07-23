import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { listRecentVersions } from "@/lib/db/designs";
import { signedUrl } from "@/lib/db/storage";

// בק־אופיס: יומן כל היצירות האחרונות (מכל המשתמשים) — הדמיה, SVG, סטטוס ומדדים,
// כדי לאתר בעיות מתלונות משתמשים בדיעבד.

export const maxDuration = 60;

export async function GET() {
  try {
    const rows = await listRecentVersions(80);
    const items = await Promise.all(
      rows.map(async (r) => {
        const report = (r.validation_report ?? {}) as {
          renderPngPath?: string | null;
          vectorizer?: { iou?: number; holes?: number; meanDeviationMm?: number } | null;
        };
        let renderUrl: string | null = null;
        if (report.renderPngPath) {
          try {
            renderUrl = await signedUrl(report.renderPngPath, 3600);
          } catch {
            renderUrl = null;
          }
        }
        return {
          versionId: r.id,
          designId: r.design_id,
          designName: r.design_name,
          widthMm: r.design_width_mm,
          versionNo: r.version_no,
          status: r.validation_status,
          createdAt: r.created_at,
          prompt: r.user_prompt,
          renderUrl,
          svg: r.svg,
          metrics: report.vectorizer ?? null,
        };
      }),
    );
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
