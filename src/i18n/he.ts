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
  renderView: "רנדר AI",

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
  convertToSvg: "המרת תמונה ל-SVG",
  convertToSvgHint: "הופך תמונת עיצוב מתכתית ל-SVG נקי לייצור",
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

  // ===== אתר המותג (עמודים ציבוריים סביב הסטודיו) =====
  site: {
    brand: "RM JEWEL",
    brandHe: "אר. אם. ג'ואל",
    tagline: "Precision jewelry, formed around you.",

    // ניווט
    navHome: "בית",
    navHowItWorks: "איך זה עובד",
    navGallery: "גלריה",
    navFaq: "שאלות ותשובות",
    navContact: "יצירת קשר",
    ctaStart: "התחלת עיצוב",
    ctaStartLong: "עיצוב תכשיט משלכם",
    openMenu: "פתיחת תפריט",
    closeMenu: "סגירת תפריט",

    // Hero (עמוד בית) — לפי ה-handoff של RM JEWEL
    heroEyebrow: "CUSTOM · LASER-CUT · MADE AROUND YOU",
    heroTitleLine1: "תכשיט שנבנה",
    heroTitleLine2: "סביבך.",
    heroTitle: "תכשיט שנבנה סביבך.",
    heroEnglishTagline: "Precision jewelry, formed around you.",
    heroSubtitle:
      "עצבו צמיד או טבעת פתוחים משלכם. התחילו מרעיון, שרטוט או תמונה — נהלו שיחה קצרה עם מנוע העיצוב, קבלו חלופות וערכו אותן עד לתכשיט שהוא רק שלכם.",
    heroPriceNote: "החל מ־₪310 · 10–14 ימי עבודה",
    heroCtaPrimary: "התחלת עיצוב",
    heroCtaSecondary: "איך זה עובד",

    // רצועת "איך מתחילים" (עמוד בית)
    startTitle: "איך מתחילים",
    start1Title: "כתיבת רעיון",
    start1Body: "תארו במילים מה תרצו — סגנון, תחושה, פרטים.",
    start2Title: "העלאת שרטוט",
    start2Body: "סקיצה ידנית או קובץ וקטורי כנקודת פתיחה.",
    start3Title: "תמונת השראה",
    start3Body: "תמונה שמשמשת כהשראה בלבד — לא כהעתק.",

    // רצועת ערך (עמוד בית)
    valuesTitle: "מהרעיון למתכת, בלי מתווכים",
    value1Title: "עיצוב בשיחה",
    value1Body: "מתארים במילים מה בא לכם, ומעדנים בשיחה ובסימונים על הקנבס — בלי תוכנות גרפיקה.",
    value2Title: "בדוק לייצור",
    value2Body: "כל עיצוב עובר בדיקת ייצוריות אוטומטית: רוחב גשרים, גודל פתחים, שוליים ושרידות בערגול.",
    value3Title: "מוכן לחיתוך",
    value3Body: "הפלט הוא קובץ DXF במ\"מ, מוכן ישירות לחיתוך לייזר — בלי סבב תיקונים ידני.",

    // חומר ומוצר (עמוד בית)
    materialTitle: "פליז אמיתי, חתוך בלייזר",
    materialBody:
      "כל פריט נחתך מלוח פליז בעובי 1.5 מ\"מ בחיתוך לייזר סיבים, ואז מעורגל לקשת פתוחה — צמיד או טבעת שנפתחים בעדינות ומתאימים למידה. הדוגמה היא ניקוב עדין ברצועה, שנשאר חזק גם אחרי הכיפוף.",
    materialSpecMaterial: "חומר",
    materialSpecMaterialVal: "פליז C260",
    materialSpecCut: "חיתוך",
    materialSpecCutVal: "לייזר סיבים",
    materialSpecProducts: "מוצרים",
    materialSpecProductsVal: "צמיד · טבעת",
    materialSpecMade: "ייצור",
    materialSpecMadeVal: "לפי הזמנה",

    // רצועת תהליך (עמוד בית) — לפי ה-handoff
    proc: [
      { n: "שלב 01", title: "רעיון", body: "טקסט, שרטוט או תמונה שממנה מתחילים." },
      { n: "שלב 02", title: "עיצוב", body: "מנוע ה־AI מציע חלופות ואתם עורכים אותן." },
      { n: "שלב 03", title: "חיתוך", body: "חיתוך לייזר, הסרת גראדים, החלקה וערגול." },
      { n: "שלב 04", title: "משלוח", body: "בדיקת איכות, אריזה ומשלוח עד אליכם." },
    ],

    // סעיף איך זה עובד (עמוד בית + עמוד ייעודי)
    howTitle: "איך זה עובד",
    howSubtitle: "ארבעה צעדים מהמשפט הראשון ועד קובץ חיתוך מוכן.",
    step1Title: "מתארים",
    step1Body: "כותבים בשפה חופשית את הדוגמה שרוצים — גיאומטרית, אורגנית, עדינה או נועזת. אפשר גם לצרף שרטוט או תמונת השראה.",
    step2Title: "הבינה מציירת",
    step2Body: "המנוע מייצר עיצוב מלא על הרצועה, ואפשר לעדן אותו בשיחה: \"תגדיל את זה\", \"פחות צפוף כאן\" — או לסמן ישירות על הקנבס.",
    step3Title: "בדיקת ייצור",
    step3Body: "כל גרסה נבדקת אוטומטית מול מגבלות הייצור בפועל, ואם משהו לא יחזיק — המערכת מתקנת לבד ומראה לכם איפה.",
    step4Title: "ייצוא לייצור",
    step4Body: "מקבלים קובץ DXF מדויק במ\"מ, מוכן לחיתוך לייזר. משם — למכונה.",

    // גלריה
    galleryTitle: "גלריה",
    gallerySubtitle: "דוגמאות להמחשת סגנונות ניקוב אפשריים על הרצועה. כל עיצוב אמיתי נוצר מחדש מהתיאור שלכם.",
    galleryDisclaimer: "האיורים כאן להמחשה בלבד ואינם מוצרים ממשי למכירה.",
    galleryItems: [
      { title: "משושים משורגים", desc: "רשת גיאומטרית משורגת בצפיפות בינונית" },
      { title: "גלים זורמים", desc: "קו אורגני רך לאורך הרצועה" },
      { title: "קצב עיגולים", desc: "עיגולים בגדלים משתנים בתחושת מקצב" },
      { title: "רשת יהלומים", desc: "מעוינים חוזרים בסידור סימטרי" },
      { title: "טיפות אנכיות", desc: "חיתוכים מוארכים בהטיה עדינה" },
      { title: "פסים דקים", desc: "חריצים מקבילים בקצב אחיד" },
    ],
    galleryCta: "רוצים כזה? עצבו משלכם",

    // שאלות נפוצות
    faqTitle: "שאלות נפוצות",
    faqSubtitle: "מה שכדאי לדעת על העיצוב, החומר והייצור.",
    faqItems: [
      {
        q: "איך מעצבים תכשיט בלי לדעת לצייר?",
        a: "מתארים במילים. כותבים משפט כמו \"דוגמה של משושים משורגים בצפיפות בינונית\", והבינה המלאכותית מציירת עיצוב מלא. משם מעדנים בשיחה ובסימונים על הקנבס — בלי שום תוכנת גרפיקה.",
      },
      {
        q: "מאיזה חומר עשוי התכשיט?",
        a: "פליז C260 בעובי 1.5 מ\"מ, נחתך בלייזר סיבים ומעורגל לקשת פתוחה. פליז הוא חומר חם בגוונו, עמיד, וקל לתחזוקה.",
      },
      {
        q: "מה אפשר לעצב — צמיד או טבעת?",
        a: "את שניהם. שניהם רצועה פתוחה שמעורגלת לקשת ונפתחת בעדינות למידה. בוחרים סוג מוצר ומידות, והעיצוב מתאים את עצמו.",
      },
      {
        q: "איך אתם מוודאים שהעיצוב באמת יוצא טוב?",
        a: "כל עיצוב עובר בדיקת ייצוריות אוטומטית: שהחומר נשאר גוף אחד רציף, שאין חלק שייפול בחיתוך, שהגשרים רחבים מספיק לשרוד את הכיפוף, ושהשוליים נשמרים. אם משהו לא עומד בזה, המערכת מתקנת לבד או מראה לכם איפה הבעיה.",
      },
      {
        q: "מה מקבלים בסוף?",
        a: "קובץ DXF מדויק ביחידות מ\"מ, מוכן ישירות לחיתוך לייזר, וגם תצוגת SVG נקייה. משם אפשר לגשת לייצור.",
      },
      {
        q: "כמה זה עולה וכמה זמן לוקח?",
        a: "המחיר וזמן האספקה תלויים בעיצוב ובמידה. צרו קשר ונחזור אליכם עם פרטים מדויקים.",
      },
    ],

    // יצירת קשר
    contactTitle: "יצירת קשר",
    contactSubtitle: "יש שאלה, רעיון או בקשת הזמנה? כתבו לנו ונחזור אליכם.",
    contactName: "שם",
    contactEmail: "אימייל",
    contactMessage: "הודעה",
    contactNamePlaceholder: "השם שלכם",
    contactEmailPlaceholder: "you@example.com",
    contactMessagePlaceholder: "מה תרצו לספר לנו?",
    contactSubmit: "שליחת הודעה",
    contactOr: "או ישירות באימייל:",
    contactErrorRequired: "נא למלא שם, אימייל והודעה.",
    contactErrorEmail: "כתובת האימייל אינה תקינה.",

    // פוטר
    footerTagline: "RM JEWEL — Precision jewelry, formed around you.",
    footerCopyright: "© 2026",
    footerRights: "כל הזכויות שמורות",
    footerBuiltWith: "מעוצב ומיוצר בישראל",
    footerLegal: "מדיניות ומידע",
    navTerms: "תנאי שימוש",
    navPrivacy: "מדיניות פרטיות",

    // 404
    notFoundTitle: "הדף לא נמצא",
    notFoundBody: "הקישור שגוי או שהדף הוסר. אפשר לחזור לבית או להתחיל לעצב.",
    notFoundHome: "חזרה לבית",

    // עמודים משפטיים — נוסח כללי, טעון בדיקת עורך דין לפני עלייה לאוויר
    legalNote: "המסמך מובא כבסיס כללי ואינו ייעוץ משפטי. לפני פרסום — מומלץ לעבור עם עורך/ת דין.",
    legalUpdated: "עודכן לאחרונה: יולי 2026",
    terms: {
      title: "תנאי שימוש",
      intro: "השימוש באתר forme ובכלי העיצוב שבו כפוף לתנאים שלהלן. עצם השימוש מהווה הסכמה להם.",
      sections: [
        { h: "השירות", p: "האתר מאפשר לעצב דוגמאות ניקוב לצמיד או טבעת מפליז באמצעות כלי בינה מלאכותית, ולהפיק קובץ ייצור. עיצוב שנוצר הוא הצעה — ייצור בפועל כפוף לבדיקה ולתיאום נפרד." },
        { h: "קניין רוחני", p: "הכלים, הקוד והמותג שייכים ל-forme. עיצוב שיצרתם נשאר שלכם לשימושכם; אין להעלות תוכן שמפר זכויות של צד שלישי." },
        { h: "אחריות", p: "העיצובים והבדיקות ניתנים כפי שהם (as-is). אנו משתדלים שהבדיקה הייצורית תהיה מדויקת, אך האחריות הסופית לתקינות הייצור היא של הגורם המייצר." },
        { h: "שינויים", p: "אנו רשאים לעדכן את השירות ואת התנאים. גרסה מעודכנת תפורסם בעמוד זה." },
      ],
    },
    privacy: {
      title: "מדיניות פרטיות",
      intro: "אנו מכבדים את פרטיותכם. להלן איזה מידע נאסף וכיצד הוא משמש.",
      sections: [
        { h: "איזה מידע נאסף", p: "מידע שתמסרו ביצירת קשר (שם, אימייל, תוכן ההודעה) והעיצובים שאתם יוצרים באתר. איננו אוספים אמצעי תשלום בשלב זה." },
        { h: "שימוש במידע", p: "המידע משמש למתן השירות, לשמירת העיצובים שלכם ולחזרה אליכם בעקבות פנייה. איננו מוכרים מידע לצד שלישי." },
        { h: "אחסון", p: "הנתונים מאוחסנים בשירותי ענן (Supabase, Cloudflare). קבצים ותוכן נשמרים כל עוד נדרש למתן השירות." },
        { h: "יצירת קשר בנושא פרטיות", p: "לכל שאלה או בקשה למחיקת מידע — כתבו לנו ונטפל בהקדם." },
      ],
    },

    // הזמנה / בקשת הצעת מחיר
    orderNav: "הזמנה",
    orderTitle: "בקשת הזמנה / הצעת מחיר",
    orderSubtitle: "ספרו לנו מה תרצו — סוג הפריט, רעיון לעיצוב וכמה פרטים ליצירת קשר — ונחזור אליכם עם הצעה.",
    orderProductType: "סוג פריט",
    orderProductAny: "עדיין לא בטוח/ה",
    orderName: "שם",
    orderEmail: "אימייל",
    orderPhone: "טלפון (רשות)",
    orderMessage: "מה תרצו לעצב?",
    orderMessagePlaceholder: "למשל: צמיד עם דוגמה גיאומטרית עדינה, או רעיון משלכם…",
    orderNamePlaceholder: "השם שלכם",
    orderPhonePlaceholder: "050-0000000",
    orderSubmit: "שליחת בקשה",
    orderSubmitting: "שולח…",
    orderSuccessTitle: "הבקשה נשלחה",
    orderSuccessBody: "תודה! קיבלנו את הפנייה ונחזור אליכם בהקדם.",
    orderErrorRequired: "נא למלא שם, אימייל ותיאור.",
    orderErrorEmail: "כתובת האימייל אינה תקינה.",
    orderErrorGeneric: "שליחת הבקשה נכשלה. נסו שוב.",
    orderErrorRate: "נשלחו יותר מדי בקשות מהאימייל הזה היום. נסו שוב מחר.",
    orderCta: "לבקשת הזמנה",

    // אדמין (מוגן ב-ADMIN_TOKEN)
    adminTitle: "ניהול פניות",
    adminLoginTitle: "כניסת מנהל",
    adminTokenLabel: "סיסמת ניהול",
    adminLogin: "כניסה",
    adminLogout: "יציאה",
    adminBadToken: "סיסמה שגויה.",
    adminDisabled: "האדמין אינו מוגדר (חסר ADMIN_TOKEN).",
    adminEmpty: "אין פניות עדיין.",
    adminColDate: "תאריך",
    adminColKind: "סוג",
    adminColContact: "פונה",
    adminColProduct: "פריט",
    adminColMessage: "הודעה",
    adminColStatus: "סטטוס",
    adminKindOrder: "הזמנה",
    adminKindContact: "יצירת קשר",
    adminStatusNew: "חדש",
    adminStatusContacted: "טופל",
    adminStatusClosed: "סגור",
    adminFilterAll: "הכול",
    adminLoadError: "טעינת הפניות נכשלה.",
  },

  // ===== מסע העיצוב המודרך (/design) — לפי ה-handoff של RM JEWEL =====
  design: {
    // Step rail
    steps: {
      product: "מוצר",
      sizes: "מידות",
      idea: "רעיון",
      chat: "שיחה",
      suggestions: "הצעות",
      edit: "עריכה",
      final: "הדמיה",
    },
    productLabels: { bracelet: "צמיד פתוח", ring: "טבעת פתוחה" },
    mm: "מ״מ",

    // מסך מוצר
    productEyebrow: "בחירת מוצר",
    productTitle: "מה נעצב היום?",
    productSubtitle:
      "שני הפריטים פתוחים (Open-ended) — פס מתכת שנחתך בלייזר ומעורגל למידה שלכם.",
    braceletName: "צמיד פתוח",
    braceletPrice: "מ־₪320",
    braceletDesc: "מתעטף סביב שורש כף היד עם פתח מתכוונן.",
    braceletMeta: ["מידות S–L", "רוחב 4–16 מ״מ", "10–14 ימים"],
    ringName: "טבעת פתוחה",
    ringPrice: "מ־₪240",
    ringDesc: "פתח עדין המאפשר גמישות והתאמה לאצבע.",
    ringMeta: ["מידות 5–9", "רוחב 2–8 מ״מ", "10–14 ימים"],
    ringPlaceholderLabel: "open ring",

    // מסך מידות
    sizesEyebrow: "מידות",
    sizesTitle: "המידה שלכם",
    sizesStandard: "מידה סטנדרטית",
    sizesCircLabel: "או היקף (מ״מ)",
    sizesCircPlaceholder: "הזינו היקף שורש כף היד",
    sizesOutlier: "מידה חריגה — תסומן לבדיקה אנושית לפני ייצור.",
    sizesWidthLabel: "רוחב המוצר",
    sizesGapLabel: "גודל הפתח",
    sizesFitLabel: "התאמה",
    fits: { tight: "צמודה", regular: "רגילה", loose: "משוחררת" },
    sizesSave: "שמירה והמשך",
    sizesHowTitle: "איך מודדים",
    sizesDiagramLabel: "measurement diagram",
    sizesHowBody:
      "מדדו את היקף שורש כף היד בעזרת סרט מדידה או חוט. מידת הגוף אינה זהה למידת המוצר — הפתח והערגול נלקחים בחשבון אוטומטית.",

    // מסך רעיון
    ideaEyebrow: "הזנת רעיון",
    ideaTitle: "ספרו לנו מה לעצב",
    ideaSubtitle:
      "כתבו, העלו שרטוט או תמונת השראה. ככל שתפרטו יותר, החלופות יהיו קרובות יותר לכוונה שלכם.",
    ideaPlaceholder:
      "לדוגמה: צמיד עם קווים אלכסוניים דקים, תחושה נקייה וגיאומטרית, פתח בצד, מקום קטן לתאריך בפנים...",
    ideaUpload: "+ העלאת קובץ",
    ideaFormats: "PNG · JPG · SVG · PDF",
    ideaRights:
      "יש לי זכות להשתמש בתוכן שהעליתי, ואין בכוונתי ליצור העתק של מוצר מוגן. תמונת השראה משמשת כהשראה בלבד.",
    ideaSubmit: "שליחה לעיצוב →",
    ideaAttrsTitle: "מאפיינים משלימים",
    ideaStyleLabel: "סגנון",
    styles: { geometric: "גאומטרי", organic: "אורגני", mixed: "מעורב" },
    ideaSymmetryLabel: "סימטריה",
    syms: { symmetric: "סימטרי", asymmetric: "א־סימטרי" },
    ideaDensityLabel: "צפיפות החיתוכים",
    densities: ["", "נמוכה", "בינונית", "גבוהה"],
    ideaElementLabel: "גודל האלמנטים",
    elements: ["", "קטן", "בינוני", "גדול"],
    ideaWeightLabel: "תחושה",
    weights: { delicate: "עדין", balanced: "מאוזן", massive: "מסיבי" },
    ideaTextLabel: "טקסט / שם / תאריך (אופציונלי)",
    ideaTextPlaceholder: "לחריטה עדינה בפנים",
    sampleFileNames: ["scan_01.png", "inspiration.jpg", "sketch.svg", "pattern.pdf"],

    // מסך שיחה
    chatEyebrow: "שיחה עם מנוע העיצוב",
    chatTitle: "נשלים את הפרטים",
    chatFirstMsg:
      "שלום. ספרו לי מה תרצו ליצור — צורה, תחושה, רעיון. אשאל כמה שאלות קצרות ואתרגם את זה לעיצוב.",
    chatInputPlaceholder: "כתבו תשובה...",
    chatSend: "שליחה",
    chatReplies: [
      "הבנתי. נראה לי שכדאי גריד אלכסוני עם צפיפות בינונית. מעדיפים קצב אחיד או הפרעה מכוונת בנקודה אחת?",
      "מצוין. אשמור על מרחב נקי בקצוות ואוסיף פרט חד אחד. אעביר את זה עכשיו למחולל ואציג לכם שלוש חלופות.",
      "רשמתי. שימו לב שהעתק מדויק של מוצר קיים לא ניתן לייצור אצלנו — נעבוד מתוך השראה בלבד.",
    ],
    chatSummaryTitle: "סיכום חי",
    chatSummaryKeys: {
      type: "סוג",
      size: "מידה",
      style: "סגנון",
      symmetry: "סימטריה",
      density: "צפיפות",
    },
    chatConfirm: "אישור סיכום · יצירת הצעות",
    chatBack: "← חזרה לעריכת הבקשה",

    // מסך הצעות
    sugEyebrow: "הצעות עיצוב",
    sugTitle: "שלוש חלופות",
    sugRegen: "יצירת הצעות נוספות",
    sugFlatLabel: "flat layout",
    sugRolledLabel: "הדמיה לאחר ערגול",
    sugStatusOk: "עבר בדיקה ראשונית",
    sugStatusReview: "נדרשת בדיקה",
    sugPick: "בחירה ועריכה",
    sugBack: "← חזרה לשיחה",
    sugDensityLabel: "צפיפות",
    sugComplexityLabel: "מורכבות",
    complexities: { low: "נמוכה", medium: "בינונית", high: "גבוהה" },
    suggestions: [
      {
        id: "s1", name: "Ridge", hebrew: "רכס", density: "בינונית", complexity: "נמוכה",
        cuts: 24, tilt: 0, gap: 6, price: 340,
        desc: "קווים אלכסוניים מקבילים בקצב אחיד — מבנה גיאומטרי רגוע.",
      },
      {
        id: "s2", name: "Fracture", hebrew: "שבר", density: "גבוהה", complexity: "בינונית",
        cuts: 41, tilt: -8, gap: 3, price: 395,
        desc: "חיתוך א־סימטרי עם הפרעה מכוונת בגריד. נוכחות חדה.",
      },
      {
        id: "s3", name: "Void", hebrew: "חלל", density: "נמוכה", complexity: "נמוכה",
        cuts: 12, tilt: 0, gap: 11, price: 310,
        desc: "חללים שליליים גדולים, מעט חומר. מינימליזם שקט.",
      },
    ],

    // מסך עריכה
    editEyebrow: "עריכת עיצוב",
    editTitle: "כוונון עדין",
    editParamsTitle: "פרמטרים",
    editWidthLabel: "רוחב המוצר",
    editElementLabel: "גודל האלמנטים",
    editGapLabel: "רווח בין האלמנטים",
    editRepeatsLabel: "מספר חזרות",
    editCornersLabel: "עיגול פינות",
    editRollLabel: "ערגול",
    editHandLabel: "על היד",
    editAiPlaceholder: "בקשה מילולית ל־AI: הוסיפו חיתוך אלכסוני בקצה...",
    editApply: "בצעו",
    editUndo: "↩ ביטול",
    editPrevVersion: "גרסה קודמת",
    editSave: "שמירה · מעבר לבדיקה",

    // מסך הדמיה סופית
    finalEyebrow: "הדמיה סופית ומחיר",
    finalTitle: "המוצר שלכם",
    viewFlat: "פריסה שטוחה",
    viewRolled: "לאחר ערגול",
    viewBody: "על היד",
    finalRolledLabel: "הדמיה לאחר ערגול",
    finalBodyLabel: "הדמיה על היד",
    finalDisclaimer:
      "ייתכנו הבדלים טבעיים בין ההדמיה למוצר הפיזי בגוון, בטקסטורה ובסימני העיבוד. הבדיקות אינן אישור משפטי אלא סינון מוקדם.",
    specTitle: "מפרט",
    specKeys: {
      type: "סוג",
      size: "מידה",
      width: "רוחב",
      material: "חומר",
      thickness: "עובי",
      finish: "גימור",
      gap: "פתח",
    },
    specMaterialVal: "פליז",
    specThicknessVal: "1.5 מ״מ",
    specFinishVal: "מוברש",
    priceTitle: "מחיר",
    priceBase: "מחיר בסיס",
    priceComplexity: "תוספת מורכבות",
    priceWidth: "תוספת רוחב",
    pricePackaging: "אריזה",
    priceShipping: "משלוח",
    priceVat: "מע״מ 17%",
    priceTotal: "סך הכול",
    finalOrder: "אישור ומעבר להזמנה",
    finalBack: "← חזרה לעריכה",
    checks: [
      {
        title: "בדיקת יכולת ייצור",
        status: "תקין",
        items: ["רוחב גשרים תקין", "מרחק מהקצוות תקין", "אין חלקים מנותקים", "מתאים לעובי 1.5 מ״מ"],
      },
      {
        title: "בדיקת דמיון והפרות",
        status: "לא נמצא חשד",
        items: ["לא זוהו שמות מותגים", "לא זוהו לוגואים", "דמיון חזותי נמוך למאגר"],
      },
    ],
  },
} as const;

export type I18n = typeof he;
