// טיפוסי גיאומטריה משותפים. תואמים את polygon-clipping:
// Ring = מערך נקודות [x,y]; Polygon = [טבעת חיצונית, ...חורים]; MultiPolygon = רשימת פוליגונים.

export type Pt = [number, number];
export type Ring = Pt[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

export interface ValidationLocation {
  x: number;
  y: number;
  /** רדיוס אזור ההדגשה במ"מ, לציור על הקנבס */
  r?: number;
}

export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckResult {
  check: string;
  status: CheckStatus;
  /** הודעה קריאה בעברית להצגה למשתמש */
  message: string;
  /** פירוט טכני באנגלית עבור לולאת התיקון של ה-LLM */
  details: string;
  locations: ValidationLocation[];
}

export interface ValidationReport {
  status: CheckStatus;
  checks: CheckResult[];
  metrics: {
    stripAreaMm2: number;
    cutAreaMm2: number;
    openAreaPct: number;
    estWeightGrams: number;
  };
}

/** תוצאת חישוב הגיאומטריה — לא נשמרת ב-DB, מוחזרת לקליינט לתצוגה ולתלת-ממד */
export interface GeometryPayload {
  material: MultiPolygon;
  cutUnion: MultiPolygon;
}
