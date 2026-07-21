import type { DesignDims } from "@/lib/geometry/validate";

// סעיף 6.4: ה-LLM רשאי לפלוט <text-request content x y height align/>.
// ההמרה לנתיבי אותיות (opentype.js + פונט סטנסיל / גישור אוטומטי) קורית כאן,
// בשלב הנרמול, לפני ולידציה.
//
// TODO(שלב 7): מימוש מלא עם פונט סטנסיל. עד אז אלמנט text-request נופל
// בנרמול (V1) והלולאה האוטומטית מנחה את ה-LLM לוותר על טקסט — התנהגות חיננית.

const TEXT_REQUEST_RE = /<text-request\b[^>]*\/?>/i;

export async function convertTextRequests(svg: string, dims: DesignDims): Promise<string> {
  if (!TEXT_REQUEST_RE.test(svg)) return svg;
  const { renderTextRequests } = await import("./stencil");
  return renderTextRequests(svg, dims);
}
