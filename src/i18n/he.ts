// כל מחרוזות הממשק — עברית. אין להטמיע טקסט ממשק בתוך קומפוננטות.
export const he = {
  appTitle: "סטודיו עיצוב",
  loading: "טוען…",

  // Header
  myDesigns: "העיצובים שלי",
  newDesign: "עיצוב חדש",
  unnamedDesign: "עיצוב ללא שם",
  designNamePlaceholder: "שם העיצוב",
  selectProfile: "בחירת בודק",
  duplicate: "שכפול",
  delete: "מחיקה",
  open: "פתיחה",
  confirmDelete: "למחוק את העיצוב? הפעולה אינה הפיכה.",
  noDesignsYet: "אין עדיין עיצובים לפרופיל הזה",

  // Params panel
  parameters: "פרמטרים",
  productType: "סוג מוצר",
  bracelet: "צמיד",
  ring: "טבעת",
  lengthMm: "אורך (מ\"מ)",
  widthMm: "רוחב (מ\"מ)",
  gapMm: "פער (מ\"מ)",
  thicknessMm: "עובי (מ\"מ)",
  dimsChangeTitle: "שינוי מידות",
  dimsChangeBody: "המידות ישתנו והעיצוב הקיים יותאם אליהן על ידי ה-AI. להמשיך?",
  confirm: "אישור",
  cancel: "ביטול",

  // Canvas tabs
  flatView: "שטוח",
  view3d: "הדמיה",

  // Annotation tools
  annotationTools: "כלי סימון",
  toolPen: "עט חופשי",
  toolArrow: "חץ",
  toolEllipse: "מסגרת",
  toolText: "תווית טקסט",
  toolEraser: "מחק",
  toolClearAll: "ניקוי הכול",
  textLabelPrompt: "טקסט לתווית:",
  annotationsWillBeSent: "הסימונים יישלחו יחד עם ההוראה",

  // Prompt bar
  promptPlaceholder: "תיאור העיצוב או הוראת שינוי…",
  attachImage: "צירוף תמונה",
  send: "שליחה",
  statusGenerating: "מייצר…",
  statusValidating: "בודק ייצוריות…",
  statusRepairing: "מתקן…",
  statusError: "שגיאה",

  // Empty state
  emptyTitle: "מתחילים לעצב",
  emptyBody: "תארו במילים את דוגמת הניקוב הרצויה — ה-AI ייצור עיצוב, יבדוק שהוא ניתן לייצור, ותוכלו לעדן אותו בשיחה ובסימונים על הקנבס.",
  examplePrompts: [
    "דוגמה גיאומטרית של משושים משורגים בצפיפות בינונית",
    "גלים אורגניים זורמים לאורך הצמיד",
    "שורת עיגולים בגדלים משתנים עם תחושת קצב",
  ],

  // Validation panel
  validation: "בדיקת ייצור",
  validationPass: "תקין לייצור",
  validationWarn: "אזהרות ייצור",
  validationFail: "בעיות ייצור",
  estWeight: "משקל משוער",
  grams: "גרם",
  openAreaPct: "שטח פתוח",
  focusOnIssue: "מיקוד",
  repairFailedTitle: "הוולידציה נכשלה גם אחרי תיקונים אוטומטיים",
  repairFailedBody: "נסו לנסח את הבקשה אחרת, או לבקש עיצוב פתוח פחות / גשרים רחבים יותר.",

  // Version actions
  prevVersion: "גרסה קודמת",
  nextVersion: "גרסה הבאה",
  versionLabel: "גרסה",
  exportBtn: "ייצוא לייצור",
  exportBlockedFail: "לא ניתן לייצא עיצוב עם בעיות ייצור. יש לתקן קודם.",
  exportWarnTitle: "ייצוא עם אזהרות",
  exportWarnBody: "בעיצוב יש אזהרות ייצור. לייצא בכל זאת?",
  exportForce: "ייצוא בכל זאת",
  downloadDxf: "הורדת DXF",
  downloadSvg: "הורדת SVG",
  exportReady: "קובצי הייצור מוכנים",

  // Errors
  errNetwork: "אובדן תקשורת. בדקו את החיבור ונסו שוב.",
  errLlmNotSvg: "ה-AI החזיר פלט שאינו עיצוב תקין. נסו שוב.",
  errRateLimit: "הגעתם למכסת הבקשות היומית לפרופיל זה. נסו שוב מחר.",
  errGeneric: "משהו השתבש. נסו שוב.",
  retry: "נסה שוב",

  // Validation messages by check id — הפרמטרים מוזרקים בקוד
  checks: {
    V1: "מבנה ה-SVG אינו תקין",
    V2: "החומר אינו רציף — יש חלקים מנותקים שייפלו בחיתוך",
    V3: "יש \"אי\" של חומר בתוך פתח — הוא ייפול בחיתוך",
    V4: "גשר חומר צר מדי",
    V4bend: "גשר חומר צר מדי לשרידות בערגול (עובר חיתוך, אך עלול להיקרע בכיפוף)",
    V5: "פתח קטן מדי לחיתוך",
    V6: "חריץ צר מדי",
    V7: "חירור בתוך אזור השוליים שחייב להישאר מלא",
    V8warn: "שטח פתוח גבוה — עלול להקשות על ערגול",
    V8fail: "שטח פתוח גבוה מדי לערגול",
    V9: "פינה פנימית חדה — מומלץ לעגל",
    V10: "פרט חומר קטן/עדין מדי",
  },
} as const;

export type I18n = typeof he;
