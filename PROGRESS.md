# סטטוס בנייה — סטודיו שלב 1

מסמך מעקב לפי סדר השלבים ב-`docs/BUILD_SPEC_studio_phase1.md` סעיף 14.

| שלב | תיאור | סטטוס |
|---|---|---|
| 0 | שלד ותשתית (Next.js, Cloudflare, Supabase, קונפיג ייצור) | ✅ קוד מוכן — ממתין להשלמת secrets ומיגרציה (ראו למטה) |
| 1 | שלד UI (מסך סטודיו, פרופילים, CRUD עיצובים) | ✅ |
| 2 | יצירה ראשונה (חוזה SVG, נרמול, generate) | ✅ |
| 3 | מנוע ולידציה V1–V10 + לולאת תיקון | ✅ (18 טסטים) |
| 4 | עריכה וסימונים (annotation layer + קומפוזיט) | ✅ |
| 5 | הדמיה תלת-ממדית | ✅ |
| 6 | ייצוא DXF+SVG (כולל אימות ezdxf בטסט) | ✅ |
| 7 | טקסט/פונט סטנסיל, ניווט גרסאות, הקשחה | ✅ text-to-path עם Secular One + גישור אוטומטי; ניווט גרסאות; rate limit; מצבי קצה |

**הערה:** כל הקוד בנוי ועובר בילד + 24 טסטים (כולל round-trip של DXF מול ezdxf
ואימות שאותיות עבריות סגורות לא נופלות). קריטריוני הקבלה שדורשים דיפלוי חי
(עמוד נטען ב-URL ציבורי, בדיקה מהנייד) ממתינים להשלמת ה-secrets והמיגרציה למטה.

## מה נדרש ממך (גל) כדי שהאתר יעלה

1. **מיגרציית DB** — אפשרות א': להוסיף secret בשם `SUPABASE_DB_URL`
   (Supabase → Settings → Database → Connection string URI) ואז להריץ את
   ה-workflow "Apply Supabase migrations" — ירוץ גם אוטומטית על push.
   אפשרות ב': להדביק את `supabase/migrations/0001_init.sql` ב-SQL Editor.
2. **Secrets לפריסה** (Settings → Secrets and variables → Actions):
   - `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — ✅ קיימים לפי מה שמסרת
   - `ANTHROPIC_API_KEY` — נדרש ליצירת עיצובים
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — נדרשים לפריסת ה-Worker
3. אחרי merge ל-main — ה-workflow "Deploy to Cloudflare" יפרוס את האתר
   ויעדכן את ה-secrets של ה-Worker אוטומטית.

ה-bucket בשם `studio` ושורות ששת הבודקים נוצרים אוטומטית בקריאה הראשונה
לשרת — אין צורך בהקמה ידנית מעבר למיגרציה.

## הערות מימוש

- DXF נכתב כ-R12 (AC1009) עם ישויות POLYLINE קלאסיות ולא LWPOLYLINE —
  LWPOLYLINE אינה חלק מ-R12; כך הקובץ נפתח בכל תוכנת CAD. מאומת בטסט
  round-trip מול ezdxf.
- פונט סטנסיל עברי חופשי לא נמצא (כצפוי בסעיף 15.5) — מומש מנגנון הגישור
  האוטומטי מהמפרט עם הפונט Secular One (עברית+לטינית, רישיון OFL): כל קונטור
  פנימי של אות מקבל גשרים אנכיים ברוחב minBridgeCut.
- מגבלת המכסה היומית נאכפת לפי ספירת גרסאות שנוצרו היום לפרופיל.
