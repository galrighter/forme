# אתר המותג (Public Site) — סטטוס

תשתית האתר הציבורי סביב הסטודיו. **הסטודיו עצמו** (מערכת עיצוב התכשיטים —
`/studio` וכל ה־`/api/(designs|generate|validate|export|...)`) מפותח בנפרד ולא
נגעתי בו. כאן נבנה כל מה שסביבו.

## עמודים ציבוריים (route group `(site)`)

עברית (RTL), mobile-first, Tailwind בלבד. כולם עם Header/Footer משלהם; הסטודיו
נשאר על ה־root layout בלבד.

| נתיב | תיאור |
|---|---|
| `/` | דף בית — Hero, ערכים, חומר ומוצר, תקציר "איך זה עובד", CTA לסטודיו + להזמנה |
| `/how-it-works` | ארבעת שלבי התהליך |
| `/gallery` | שש דוגמאות סגנון (איורים דקורטיביים, מסומנים כהמחשה) |
| `/faq` | שאלות נפוצות עם אקורדיון |
| `/order` | בקשת הזמנה / הצעת מחיר — טופס שנשמר ב-DB (`inquiries`) |
| `/contact` | טופס יצירת קשר שמרכיב `mailto:` |
| `/terms`, `/privacy` | עמודים משפטיים (בסיס כללי, טעון בדיקת עו"ד) |

`/` החליף את ה־redirect הישן ל־`/studio`.

## תשתית SEO / גילוי

- `sitemap.xml`, `robots.txt` (חוסם `/api` ו-`/admin`)
- מטא-דאטה בשורש: `metadataBase`, description, OpenGraph, Twitter — נירשת לכל העמודים
- `public/llms.txt` — לגילוי ע"י מנועי תשובות (GEO)
- `manifest.webmanifest` (PWA, RTL, גוון פליז) + `app/icon.svg` (favicon)
- 404 מעוצב (`not-found.tsx`)

## הזמנות / פניות (lead intake)

- **DB:** מיגרציה `supabase/migrations/0002_site.sql` — טבלת `inquiries` (נפרדת
  מטבלאות הסטודיו, RLS פעיל בלי policies = service-role בלבד).
- **API:** `POST /api/inquiries` (ציבורי, zod + honeypot + הגבלת קצב לפי אימייל),
  `GET /api/inquiries` + `PATCH /api/inquiries/:id` (מוגני אדמין).
- **אדמין:** `/admin` — דשבורד לניהול פניות (סינון לפי סטטוס, עדכון סטטוס). מוגן
  ב-shared-secret פשוט (`ADMIN_TOKEN`), עוגיית HttpOnly. `noindex`. זה **אינו**
  auth משתמשים מלא — הוא למפעיל יחיד.

## קבצים עיקריים

- `src/app/(site)/…` — layout + עמודי האתר · `src/app/admin/…` — דשבורד
- `src/app/api/(inquiries|admin)/…` — ה-API של האתר
- `src/lib/db/inquiries.ts` · `src/lib/admin.ts` · `src/lib/site.config.ts`
- `src/components/site/*` · `src/components/admin/AdminDashboard.tsx`
- `src/i18n/he.ts` — כל המחרוזות תחת `he.site`

## לגל — נדרש ממך

1. **מיגרציה** — `0002_site.sql` תרוץ אוטומטית ב-workflow "Apply Supabase
   migrations" על merge ל-main (אם מוגדר `SUPABASE_DB_URL`), או הדבק ידנית ב-SQL Editor.
2. **`ADMIN_TOKEN`** (secret של ה-Worker, ≥8 תווים) — כדי לפתוח את `/admin`. בלעדיו
   האדמין מושבת (העמוד מציג "אינו מוגדר"); הטופס הציבורי עובד בכל מקרה.
3. `src/lib/site.config.ts`: `contactEmail` הוא placeholder — להחליף בכתובת אמיתית.
4. הגלריה — איורים להמחשה; להחליף בעיצובים אמיתיים כשתרצה.

## מה נשאר (חסום חיצונית / דורש תיאום)

- **תשלום חי** — דורש ספק סליקה + secrets (Cardcom / Tranzila / Stripe). ה-flow
  הנוכחי מסתיים ב"בקשה נשמרה" (lead); סליקה תתחבר כשייבחר ספק.
- **חשבונות משתמשים אמיתיים + הזמנות מקושרות לעיצוב** — נשענים על טבלאות הסטודיו
  (עיצוב שייך למשתמש), ולכן עדיף לתאם עם סשן הסטודיו לפני שינוי ה-schema המשותף.

## בדיקות

`tsc --noEmit` ✓ · `vitest` ✓ (27/27) · `next build` ✓ (כל העמודים הציבוריים
סטטיים) · שער האדמין, הוולידציה וה-honeypot נבדקו ב-curl · אין גלישה אופקית
ב-390px · בדיקה ויזואלית בדסקטופ ובמובייל.
