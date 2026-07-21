import type { DesignDims } from "@/lib/geometry/validate";

// TODO(שלב 7): המרת <text-request> לנתיבי אותיות עם opentype.js ופונט סטנסיל
// (או גישור אוטומטי לקונטורים פנימיים). עד אז — משאירים את האלמנט כמו שהוא;
// הנרמול ידחה אותו וה-LLM יתבקש לתקן בלי טקסט.

export async function renderTextRequests(svg: string, _dims: DesignDims): Promise<string> {
  return svg;
}
