# מפרט טכני מלא ל־MVP  
## המרת תמונת צמיד דו־גונית ל־SVG נאמן למקור

> מסמך זה מיועד לשמש כמסמך עבודה ישיר עבור Claude Code.  
> יש לממש את המערכת לפי הדרישות במסמך, ללא הרחבת היקף מעבר ל־MVP אלא אם הדבר נדרש כדי לעמוד בקריטריוני הקבלה.

---

# 1. תקציר המוצר

המערכת מקבלת תמונת PNG דו־גונית של צמיד בפריסה שטוחה, יחד עם המידות הפיזיות של העיצוב במילימטרים, ומחזירה קובץ SVG נקי ונאמן ככל האפשר לתמונה.

התמונה נוצרת מראש באמצעות מנוע יצירת תמונות. מנוע יצירת התמונה אינו חלק מה־MVP.

המערכת אינה נדרשת:

- לעצב את הצמיד.
- לשנות את העיצוב.
- לתקן בעיות הנדסיות.
- לבדוק התאמה לחיתוך לייזר.
- לבצע פיצוי kerf.
- לייצר DXF.
- לעבוד עם צילום של תכשיט מכופף או תלת־ממדי.

המטרה היחידה של ה־MVP היא:

```text
PNG דו־גוני + מידות פיזיות
→ מסכה בינארית
→ חילוץ גאומטריה
→ המרה לעקומות וקטוריות
→ ניקוי גאומטרי
→ SVG
→ רינדור חוזר
→ בדיקת נאמנות
→ אישור או דחייה
```

---

# 2. מטרות ה־MVP

## 2.1 מטרות פונקציונליות

המערכת תאפשר למשתמש:

1. להעלות קובץ PNG.
2. להזין רוחב וגובה במילימטרים.
3. להגדיר אם האזור הכהה מייצג מתכת או חלל.
4. להפעיל המרה.
5. לראות:
   - תמונת מקור.
   - תצוגת SVG.
   - Overlay של המקור וה־SVG.
   - מדדי נאמנות.
6. להוריד:
   - SVG של צורת המתכת.
   - SVG של אזורי החיתוך.
   - PNG של הרינדור הווקטורי.
   - PNG של מפת ההבדלים.
   - JSON של תוצאות ההמרה.
7. לקבל הודעת דחייה ברורה כאשר לא ניתן להפיק SVG נאמן מספיק.

## 2.2 מטרות טכניות

- כל paths שמייצגים שטח יהיו סגורים.
- היררכיית חורים ואיים תישמר.
- לא יהיו קווים כפולים או צורות חופפות מיותרות.
- לא יהיו self-intersections בקובץ הסופי.
- ה־viewBox יהיה תואם למידות במילימטרים.
- תוצאת ה־SVG תיבדק אוטומטית מול תמונת המקור.
- המערכת תבחר אוטומטית את התוצאה הטובה ביותר מתוך מספר מועמדים.
- המערכת תפעל ללא GPU.
- המערכת לא תהיה תלויה בשירות API חיצוני כדי לבצע המרה בסיסית.

---

# 3. הגדרת היקף

## 3.1 כלול ב־MVP

- קלט PNG.
- תמונות דו־גוניות.
- Anti-aliasing בקצוות.
- מידות רוחב וגובה במילימטרים.
- זיהוי אוטומטי של שני צבעים דומיננטיים.
- הגדרת dark region כ־metal או background.
- יצירת מסכה בינארית.
- ניקוי רעש מינימלי.
- חילוץ קונטורים והיררכיה.
- המרה ל־SVG.
- ניקוי גאומטרי.
- מספר מועמדי tracing.
- רינדור SVG חזרה ל־PNG.
- חישוב IoU.
- חישוב סטיית קונטור ממוצעת ומרבית.
- בדיקת טופולוגיה.
- בחירת מועמד אוטומטית.
- ממשק Web בסיסי.
- REST API.
- Docker.
- בדיקות אוטומטיות.
- קבצים זמניים בלבד.
- מחיקה אוטומטית של קבצים זמניים.

## 3.2 לא כלול ב־MVP

- JPG כמקור מומלץ.
- קלט SVG קיים.
- PDF.
- DXF.
- צילום של צמיד מכופף.
- תיקון פרספקטיבה.
- הסרת רקע מתמונה מורכבת.
- צללים, תאורה, טקסטורה או גרדיאנטים.
- עריכת Bézier ידנית.
- מערכת משתמשים.
- מסד נתונים קבוע.
- תשלומים.
- שמירת פרויקטים.
- LLM בתוך תהליך ההמרה.
- Vectorizer.ai כברירת מחדל.
- פיצוי kerf.
- בדיקות מינימום גשר או מינימום חור.
- בדיקות התאמה מכנית או ייצורית.
- חיבור איים מנותקים.
- שינוי יזום של העיצוב.

---

# 4. חוזה הקלט

## 4.1 פורמט תמונה

הקלט התקין הוא PNG בלבד.

המערכת תדחה קבצים שאינם PNG עם קוד שגיאה ברור.

### דרישות מומלצות לתמונה

- מבט ישר מלמעלה.
- פריסה שטוחה.
- ללא פרספקטיבה.
- ללא צללים.
- ללא השתקפויות.
- ללא טקסטורה.
- ללא גרדיאנטים.
- שני צבעים דומיננטיים בלבד.
- יחס רוחב־גובה תואם למידות הפיזיות.
- רזולוציה של לפחות 2,048 פיקסלים בציר הארוך.
- עדיפות ל־4,096 פיקסלים בציר הארוך.
- רקע אחיד.
- אין שוליים מיותרים אם הם אינם חלק מהמידות.

### צבעים מומלצים

```text
#000000 = מתכת
#FFFFFF = חלל או רקע
```

המערכת צריכה לתמוך גם ב־anti-aliasing אפור בקצוות.

## 4.2 שדות קלט

```text
image: PNG file
width_mm: float
height_mm: float
dark_region_role: "metal" | "background"
output_mode: "both" | "metal" | "cutouts"
```

ברירת מחדל:

```text
dark_region_role = "metal"
output_mode = "both"
```

## 4.3 מגבלות קלט

```text
width_mm > 0
height_mm > 0
width_mm <= 1000
height_mm <= 1000
file_size <= 20 MB
min_image_dimension >= 256 px
max_image_dimension <= 8192 px
```

## 4.4 בדיקת יחס ממדים

יש לחשב:

```text
image_ratio = image_width_px / image_height_px
physical_ratio = width_mm / height_mm
ratio_error = abs(image_ratio - physical_ratio) / physical_ratio
```

ברירת מחדל:

```text
ratio_error <= 0.01
```

אם החריגה בין 1% ל־3%:

- להציג אזהרה.
- לאפשר המרה.
- לבצע התאמה לא־אחידה רק אם המשתמש אישר זאת במפורש.

אם החריגה מעל 3%:

- לדחות את ההמרה.
- לא למתוח את העיצוב אוטומטית.

ב־MVP, ברירת המחדל היא דחייה ולא תיקון.

---

# 5. חוזה הפלט

כל המרה מוצלחת תחזיר תיקייה לוגית המכילה:

```text
metal.svg
cutouts.svg
rendered.png
difference.png
overlay.png
result.json
```

## 5.1 metal.svg

מייצג את השטח שנשאר כחומר.

מבנה נדרש:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 160 15">
  <g id="metal" fill="black" fill-rule="evenodd">
    <path d="...Z"/>
  </g>
</svg>
```

## 5.2 cutouts.svg

מייצג את האזורים שנחתכים מתוך מלבן בגודל המוצר.

מבנה נדרש:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 160 15">
  <g id="cutouts" fill="black" fill-rule="evenodd">
    <path d="...Z"/>
  </g>
</svg>
```

## 5.3 rendered.png

רינדור של `metal.svg` חזרה לתמונת PNG באותה רזולוציה כמו מסכת המקור.

## 5.4 difference.png

מפת הבדלים שבה מוצגים:

- פיקסלים שנמצאים במקור אך חסרים ב־SVG.
- פיקסלים שנוספו ב־SVG אך לא היו במקור.
- אזורים זהים.

אין דרישה לצבעים מסוימים ב־MVP, אך יש להציג את שלושת המצבים באופן ברור.

## 5.5 overlay.png

Overlay של תמונת המקור והרינדור הווקטורי בשקיפות.

## 5.6 result.json

דוגמה:

```json
{
  "job_id": "8d44ab1d-85b8-4e65-beb7-6d224e6dd3ca",
  "status": "approved",
  "input": {
    "width_px": 3200,
    "height_px": 300,
    "width_mm": 160.0,
    "height_mm": 15.0,
    "dark_region_role": "metal"
  },
  "selected_candidate": {
    "candidate_id": "threshold_128_epsilon_0.4",
    "threshold": 128,
    "simplification_tolerance_mm": 0.04
  },
  "metrics": {
    "iou": 0.9934,
    "mean_contour_deviation_mm": 0.031,
    "max_contour_deviation_mm": 0.104,
    "source_connected_components": 1,
    "vector_connected_components": 1,
    "source_holes": 4,
    "vector_holes": 4,
    "topology_ok": true
  },
  "geometry": {
    "path_count": 5,
    "anchor_point_count": 214,
    "self_intersections": 0,
    "zero_area_rings": 0,
    "open_paths": 0
  },
  "files": {
    "metal_svg": "/api/jobs/{job_id}/files/metal.svg",
    "cutouts_svg": "/api/jobs/{job_id}/files/cutouts.svg",
    "rendered_png": "/api/jobs/{job_id}/files/rendered.png",
    "difference_png": "/api/jobs/{job_id}/files/difference.png",
    "overlay_png": "/api/jobs/{job_id}/files/overlay.png"
  },
  "warnings": []
}
```

---

# 6. ארכיטקטורה

## 6.1 Stack מומלץ

### Backend

- Python 3.12
- FastAPI
- Uvicorn
- Pydantic
- Pillow
- OpenCV
- NumPy
- scikit-image
- Shapely
- VTracer
- CairoSVG או resvg
- svgpathtools או parser פנימי מוגבל
- pytest
- httpx
- Ruff
- mypy

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS או CSS Modules
- Canvas או SVG DOM עבור overlay
- fetch API
- Vitest
- React Testing Library
- Playwright

### Packaging

- Docker
- Docker Compose
- Makefile
- `.env.example`

## 6.2 עקרונות ארכיטקטוניים

- ה־backend הוא source of truth לכל החישובים.
- ה־frontend אינו מבצע tracing.
- כל תהליך ההמרה הוא deterministic עבור אותו קלט ואותן הגדרות.
- כל candidate נשמר רק בזמן העבודה.
- לא נדרש מסד נתונים ב־MVP.
- לכל job מוקצה UUID.
- קבצים נשמרים תחת תיקייה זמנית מבודדת.
- כל job נמחק אוטומטית לאחר TTL.
- אין לוגים המכילים תוכן בינארי של תמונות.
- כל פעולת עיבוד תדווח באמצעות structured logs.

---

# 7. מבנה Repository

```text
raster-to-svg-mvp/
├── README.md
├── Makefile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── algorithm.md
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── logging_config.py
│   │   ├── api/
│   │   │   ├── routes_health.py
│   │   │   ├── routes_jobs.py
│   │   │   └── schemas.py
│   │   ├── core/
│   │   │   ├── image_validation.py
│   │   │   ├── color_analysis.py
│   │   │   ├── mask_generation.py
│   │   │   ├── morphology.py
│   │   │   ├── contour_extraction.py
│   │   │   ├── candidate_generation.py
│   │   │   ├── tracing.py
│   │   │   ├── geometry_cleanup.py
│   │   │   ├── topology.py
│   │   │   ├── svg_builder.py
│   │   │   ├── renderer.py
│   │   │   ├── metrics.py
│   │   │   ├── candidate_selection.py
│   │   │   └── pipeline.py
│   │   ├── models/
│   │   │   ├── job.py
│   │   │   ├── metrics.py
│   │   │   └── candidate.py
│   │   ├── storage/
│   │   │   ├── job_storage.py
│   │   │   └── cleanup.py
│   │   └── utils/
│   │       ├── files.py
│   │       ├── ids.py
│   │       └── timing.py
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── fixtures/
│       └── golden/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── DimensionInputs.tsx
│   │   │   ├── ConversionStatus.tsx
│   │   │   ├── ImageComparison.tsx
│   │   │   ├── MetricsPanel.tsx
│   │   │   ├── WarningList.tsx
│   │   │   └── DownloadPanel.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   └── validation.ts
│   │   └── styles/
│   └── tests/
└── scripts/
    ├── generate_test_fixtures.py
    └── benchmark.py
```

---

# 8. מודל Job

אין צורך במסד נתונים. Job נשמר בזיכרון ובקבצים זמניים.

## 8.1 JobStatus

```python
from enum import StrEnum

class JobStatus(StrEnum):
    CREATED = "created"
    VALIDATING = "validating"
    PROCESSING = "processing"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"
```

## 8.2 Job Metadata

```python
class JobMetadata(BaseModel):
    job_id: UUID
    status: JobStatus
    created_at: datetime
    expires_at: datetime
    width_mm: float
    height_mm: float
    dark_region_role: Literal["metal", "background"]
    output_mode: Literal["both", "metal", "cutouts"]
    error_code: str | None = None
    error_message: str | None = None
```

---

# 9. API

## 9.1 Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

## 9.2 יצירת Job והמרה

```http
POST /api/jobs
Content-Type: multipart/form-data
```

Fields:

```text
image
width_mm
height_mm
dark_region_role
output_mode
```

Response אפשרי:

```json
{
  "job_id": "uuid",
  "status": "processing"
}
```

ב־MVP ניתן לבצע את העיבוד באופן סינכרוני אם זמן ההמרה נשאר מתחת לסף הביצועים. עם זאת, מבנה ה־API צריך לאפשר מעבר קל לעיבוד אסינכרוני בהמשך.

### המלצה ל־MVP

- לבצע עיבוד סינכרוני.
- timeout שרת של 60 שניות.
- להחזיר תוצאה מלאה אם העיבוד הסתיים.
- אם זמן העיבוד עולה באופן עקבי מעל 10 שניות, לעבור ל־background worker בשלב הבא.

## 9.3 קבלת סטטוס

```http
GET /api/jobs/{job_id}
```

## 9.4 הורדת קובץ

```http
GET /api/jobs/{job_id}/files/{filename}
```

Allowed filenames:

```text
metal.svg
cutouts.svg
rendered.png
difference.png
overlay.png
result.json
```

יש למנוע path traversal.

## 9.5 מחיקת Job

```http
DELETE /api/jobs/{job_id}
```

## 9.6 קודי שגיאה

```text
INVALID_FILE_TYPE
FILE_TOO_LARGE
IMAGE_TOO_SMALL
IMAGE_TOO_LARGE
INVALID_DIMENSIONS
ASPECT_RATIO_MISMATCH
INSUFFICIENT_COLOR_SEPARATION
TOO_MANY_DOMINANT_COLORS
NO_FOREGROUND_FOUND
FULL_FOREGROUND_IMAGE
TOPOLOGY_CHANGED
SIMILARITY_TOO_LOW
GEOMETRY_INVALID
RENDER_FAILED
TRACE_FAILED
INTERNAL_ERROR
```

---

# 10. תהליך עיבוד מלא

## 10.1 שלב A — Decode ו־Validation

1. לקרוא את הקובץ באמצעות Pillow.
2. לוודא ש־MIME וחתימת הקובץ תואמים PNG.
3. להמיר ל־RGBA.
4. לטפל ב־alpha:
   - אם יש רקע שקוף, להמיר שקיפות לצבע רקע בהתאם להגדרה.
   - ברירת מחדל: שקיפות נחשבת background.
5. לבדוק רזולוציה.
6. לבדוק יחס ממדים.
7. למנוע decompression bomb.
8. להסיר metadata שאינו נדרש.

Output:

```python
ValidatedImage(
    rgba: np.ndarray,
    width_px: int,
    height_px: int,
)
```

## 10.2 שלב B — ניתוח צבע

מטרות:

- לזהות שני clusters דומיננטיים.
- להעריך אם התמונה אכן דו־גונית.
- לזהות anti-aliasing בקצוות.

אלגוריתם מומלץ:

1. להמיר RGB ל־Lab.
2. לדגום עד 100,000 פיקסלים.
3. לבצע KMeans עם `k=2`.
4. לחשב:
   - גודל כל cluster.
   - מרחק בין centroids.
   - אחוז פיקסלים שאינם קרובים לאחד משני centroids.
5. להפיק score של הפרדת צבעים.

אפשרות פשוטה יותר עבור קלט שחור־לבן:

- grayscale.
- histogram.
- Otsu threshold.

העדיפות ב־MVP:

- להתחיל ב־grayscale + Otsu.
- לשמור abstraction שמאפשר לעבור ל־Lab/KMeans.

דחייה אם:

```text
foreground_ratio < 0.001
foreground_ratio > 0.999
```

אזהרה אם:

```text
color_separation_score נמוך
```

## 10.3 שלב C — יצירת מסכה בינארית

Output:

```text
mask[y, x] ∈ {0, 255}
```

אם `dark_region_role = metal`:

```text
dark pixels → 255
light pixels → 0
```

אם `dark_region_role = background`:

```text
dark pixels → 0
light pixels → 255
```

יש לשמור שתי גרסאות:

```text
raw_mask
clean_mask
```

## 10.4 שלב D — ניקוי מינימלי

הניקוי חייב להיות שמרני.

ברירות מחדל:

```text
opening_kernel_px = max(1, round(min(width_px, height_px) * 0.0005))
closing_kernel_px = opening_kernel_px
min_component_area_px = max(4, round(total_pixels * 0.000001))
max_fill_hole_area_px = max(4, round(total_pixels * 0.000001))
```

הפעולות:

1. Connected components.
2. הסרת רכיבים קטנים בלבד.
3. Filling של חורים זעירים בלבד.
4. Morphological opening קטן.
5. Morphological closing קטן.

כל שינוי בין `raw_mask` ל־`clean_mask` חייב להימדד.

אם הניקוי שינה יותר מ־0.1% מהפיקסלים:

- להוסיף warning.
- לא לדחות אוטומטית.

## 10.5 שלב E — יצירת Candidates

יש ליצור מספר מועמדים ולא להסתמך על סט פרמטרים יחיד.

### Threshold candidates

אם Otsu החזיר `t`:

```text
t - 12
t - 6
t
t + 6
t + 12
```

יש להגביל לטווח 0–255.

### Simplification candidates

יש לעבוד ביחידות מ"מ:

```text
0.01 mm
0.025 mm
0.05 mm
0.075 mm
0.1 mm
```

מספר מועמדים תאורטי:

```text
5 thresholds × 5 tolerances = 25 candidates
```

כדי לשמור על ביצועים, ניתן לבצע שני שלבים:

1. ליצור 5 candidates לפי threshold עם simplification בינוני.
2. לבחור 2 thresholds מובילים.
3. להריץ עבורם 5 tolerances.

סה"כ מקסימום:

```text
15 candidates
```

## 10.6 שלב F — Tracing

יש לתמוך בשני backends מאחורי interface אחיד.

```python
class Tracer(Protocol):
    def trace(self, mask: np.ndarray, config: TraceConfig) -> TracedGeometry:
        ...
```

### Backend ראשי: VTracer

הגדרות מומלצות:

```text
colormode = binary
mode = spline
filter_speckle = 0 או נמוך
corner_threshold = 60
path_precision = 3–5
```

הערה:

- אין לתת ל־VTracer להסיר פרטים שהמערכת כבר החליטה לשמר.
- ניקוי speckles עדיף לבצע לפני tracing.

### Backend חלופי פנימי: OpenCV contours

משמש ל־fallback ולבדיקות.

1. `cv2.findContours`
2. `RETR_TREE`
3. `CHAIN_APPROX_NONE`
4. `approxPolyDP`
5. serialize polyline ל־SVG path

המטרה אינה בהכרח להשתמש בו בתוצאה הסופית, אלא לאפשר:

- השוואה.
- fallback.
- golden tests.
- בידוד תקלות של VTracer.

## 10.7 שלב G — המרה לקואורדינטות מ"מ

```text
scale_x = width_mm / image_width_px
scale_y = height_mm / image_height_px
```

כאשר יחס הממדים תקין:

```text
scale_x ≈ scale_y
```

כל נקודה:

```text
x_mm = x_px * scale_x
y_mm = y_px * scale_y
```

דיוק מספרי:

```text
4–6 ספרות אחרי הנקודה
```

אין לעגל מוקדם מדי.

## 10.8 שלב H — Geometry Cleanup

לכל candidate:

1. parse paths.
2. להמיר ל־Shapely Polygon/MultiPolygon.
3. לבצע:
   - `make_valid`
   - `buffer(0)` רק אם נדרש
   - union
   - הסרת גאומטריות בעלות שטח אפס
   - הסרת rings קצרים מאוד
4. לוודא:
   - אין self-intersections.
   - כל ring סגור.
   - החורים משויכים ל־polygon הנכון.
5. לשמור את הטופולוגיה.
6. לבצע simplification עם `preserve_topology=True`.
7. לא לבצע offset.
8. לא לבצע smoothing שמגדיל שגיאה מעבר לסף.

## 10.9 שלב I — יצירת SVG

דרישות:

- SVG 1.1 או SVG2 בסיסי.
- `viewBox="0 0 width_mm height_mm"`.
- ללא `width` ו־`height` כברירת מחדל.
- ללא transforms.
- ללא masks.
- ללא clip paths.
- ללא embedded raster.
- ללא stroke לצורת החומר.
- `fill="black"`.
- `fill-rule="evenodd"`.
- כל subpath סגור ב־`Z`.
- path data במידות מ"מ.
- אין metadata מיותר.

## 10.10 שלב J — Cutouts Geometry

ליצירת `cutouts.svg`:

1. ליצור מלבן:
   ```text
   box(0, 0, width_mm, height_mm)
   ```
2. לבצע:
   ```text
   cutouts = full_rectangle.difference(metal_geometry)
   ```
3. לנקות גאומטריה.
4. לייצא ל־SVG.

## 10.11 שלב K — רינדור חוזר

לכל candidate:

1. לרנדר את `metal.svg`.
2. להשתמש באותה רזולוציה כמו מסכת המקור.
3. לבטל anti-aliasing במדידה או לבצע threshold לאחר הרינדור.
4. ליישר את הקואורדינטות ללא padding.
5. לקבל `rendered_mask`.

חשוב:

- אין לבצע resize לאחר הרינדור.
- אין לשנות aspect ratio.
- יש להשתמש ברקע לבן וחומר שחור או להפך באופן עקבי.

## 10.12 שלב L — חישוב מדדים

### IoU

```python
intersection = np.logical_and(source_mask, rendered_mask).sum()
union = np.logical_or(source_mask, rendered_mask).sum()
iou = intersection / union
```

### Pixel Error Rate

```text
xor_pixels / total_pixels
```

### Mean Contour Deviation

1. להפיק distance transform של source boundary.
2. למדוד את מרחק נקודות vector boundary ל־source boundary.
3. לבצע גם בכיוון ההפוך.
4. לחשב ממוצע סימטרי.
5. להמיר פיקסלים למ"מ.

### Max Contour Deviation

להשתמש ב־symmetric Hausdorff distance או approximation יעיל.

### Area Difference

```text
abs(source_area - vector_area) / source_area
```

### Topology

יש להשוות:

- מספר connected components.
- מספר holes.
- עומק hierarchy.
- Euler characteristic.
- האם קיימים חיבורים שנשברו.

## 10.13 שלב M — Scoring

Candidate פסול אם:

```text
topology_ok == false
self_intersections > 0
open_paths > 0
iou < MIN_IOU_HARD
```

ברירות מחדל:

```text
MIN_IOU_HARD = 0.985
TARGET_IOU = 0.99
MAX_MEAN_DEVIATION_MM = 0.05
MAX_MAX_DEVIATION_MM = 0.15
```

Score מוצע:

```text
score =
    0.55 * normalized_iou
  + 0.20 * normalized_mean_deviation
  + 0.15 * normalized_max_deviation
  + 0.05 * normalized_area_difference
  + 0.05 * normalized_anchor_efficiency
```

כאשר:

- topology הוא gate ולא משקל.
- פחות anchor points עדיף רק לאחר עמידה במדדי הנאמנות.
- אין לבחור candidate פשוט יותר אם הוא פחות נאמן.

## 10.14 שלב N — Approval

סטטוס `approved` אם:

```text
topology_ok == true
iou >= 0.99
mean_contour_deviation_mm <= 0.05
max_contour_deviation_mm <= 0.15
```

סטטוס `approved_with_warning` אינו נדרש ב־API הראשוני. במקום זאת:

- להחזיר `approved`.
- להוסיף warnings.

סטטוס `rejected` אם:

- אין candidate שעומד בסף הקשיח.
- topology השתנתה.
- tracing נכשל.
- הרינדור נכשל.
- input אינו עומד בחוזה.

---

# 11. בדיקת טופולוגיה

## 11.1 Connected Components

יש לספור connected components במסכת המקור ובמסכת ה־SVG.

ברירת מחדל:

```text
source_components == vector_components
```

## 11.2 Holes

יש לחשב holes לפי hierarchy או Euler characteristic.

```text
holes_source == holes_vector
```

## 11.3 Nesting

אם קיימים איים בתוך חורים, יש להשוות את מבנה הקינון ולא רק את מספר החורים.

ייצוג מומלץ:

```python
TopologyNode(
    area: float,
    depth: int,
    children: list["TopologyNode"]
)
```

ההשוואה אינה חייבת להתבסס על שטח זהה, אך:

- מספר nodes בכל עומק חייב להתאים.
- קשרי parent/child חייבים להתאים.

---

# 12. Frontend

## 12.1 מסך יחיד

ה־MVP יכיל מסך יחיד.

### אזור קלט

- Drop zone.
- בחירת קובץ.
- שדה `width_mm`.
- שדה `height_mm`.
- Toggle:
  - אזור כהה = מתכת.
  - אזור בהיר = מתכת.
- Select:
  - both.
  - metal.
  - cutouts.
- כפתור `המר ל־SVG`.

### מצב Processing

- Spinner.
- טקסט: `ממיר ובודק נאמנות...`
- אין להציג זמן משוער.

### אזור תוצאה

Tabs:

1. מקור.
2. SVG.
3. Overlay.
4. Difference.

Metrics:

```text
IoU
סטייה ממוצעת
סטייה מרבית
מספר paths
מספר נקודות
Topology
Status
```

Download buttons:

- `הורד metal.svg`
- `הורד cutouts.svg`
- `הורד rendered.png`
- `הורד difference.png`
- `הורד result.json`

### שגיאות

להציג:

- כותרת ברורה.
- תיאור אנושי.
- קוד שגיאה טכני בחלק מתקפל.
- המלצה לתיקון הקלט.

דוגמה:

```text
לא ניתן להמיר את התמונה באופן נאמן.

אחד הפתחים הפנימיים נעלם במהלך ההמרה.
נסה ליצור את התמונה מחדש ברזולוציה גבוהה יותר ובשחור־לבן מלא.
```

---

# 13. אבטחה

## 13.1 Upload Security

- לא להסתמך רק על extension.
- לבדוק MIME.
- לבדוק magic bytes.
- להגביל גודל.
- להגביל dimensions.
- למנוע zip bombs ו־decompression bombs.
- לא להריץ קוד מתוך קובץ.
- לא לתמוך ב־SVG input ב־MVP.

## 13.2 File Access

- filenames קבועים בלבד.
- job_id מסוג UUID.
- אין קבלת path מהמשתמש.
- אין directory listing.
- אין path traversal.
- קבצים זמניים לא יהיו תחת root ציבורי.
- הורדה תתבצע דרך endpoint מאומת מבנית.

## 13.3 Cleanup

- TTL ברירת מחדל: 60 דקות.
- cleanup task כל 10 דקות.
- מחיקה גם לאחר `DELETE /api/jobs/{job_id}`.
- מחיקה בעת startup של תיקיות ישנות.

---

# 14. Logging ו־Observability

## 14.1 Structured Logs

לכל שלב:

```text
job_id
stage
duration_ms
status
candidate_count
selected_candidate
error_code
```

אין לשמור:

- תמונה עצמה.
- base64.
- SVG מלא.
- מידע אישי.

## 14.2 Timing

למדוד:

```text
validation_ms
mask_generation_ms
candidate_generation_ms
tracing_ms
geometry_cleanup_ms
rendering_ms
metrics_ms
total_ms
```

## 14.3 Metrics עתידיים

אין חובה ל־Prometheus ב־MVP, אך הקוד צריך לאפשר הוספה.

---

# 15. ביצועים

## 15.1 יעד ביצועים

על שרת CPU בסיסי:

```text
תמונה עד 4096×4096
זמן עיבוד יעד: עד 10 שניות
זמן עיבוד מרבי: 30 שניות
```

## 15.2 מגבלות

- מקסימום Job אחד פעיל לכל worker.
- להגדיר מספר workers לפי זיכרון.
- אין לטעון במקביל את כל ה־candidates ברזולוציה מלאה אם הדבר צורך זיכרון רב.
- ניתן לבצע downsample לצורך דירוג מוקדם, אך המדידה הסופית חייבת להיות ברזולוציה המלאה.

---

# 16. ניהול קונפיגורציה

`.env.example`:

```env
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
JOB_STORAGE_DIR=/tmp/raster-to-svg
JOB_TTL_MINUTES=60
MAX_UPLOAD_MB=20
MIN_IMAGE_DIMENSION=256
MAX_IMAGE_DIMENSION=8192
MAX_ASPECT_RATIO_ERROR=0.01
MIN_IOU_HARD=0.985
TARGET_IOU=0.99
MAX_MEAN_DEVIATION_MM=0.05
MAX_MAX_DEVIATION_MM=0.15
MAX_CANDIDATES=15
LOG_LEVEL=INFO
```

יש לטעון את ההגדרות באמצעות Pydantic Settings.

---

# 17. בדיקות

## 17.1 Unit Tests

### Image Validation

- PNG תקין.
- extension מזויף.
- MIME שגוי.
- תמונה קטנה מדי.
- תמונה גדולה מדי.
- יחס ממדים שגוי.
- alpha מלא.
- תמונה ריקה.

### Mask Generation

- שחור = metal.
- לבן = metal.
- anti-aliasing.
- Otsu.
- threshold candidates.
- foreground ratio.

### Geometry

- rectangle.
- polygon.
- hole.
- island בתוך hole.
- שני components.
- self-intersection.
- zero-area ring.
- duplicate paths.

### Metrics

- masks זהות.
- masks שונות בפיקסל אחד.
- translation ידוע.
- hole חסר.
- component מנותק.
- Hausdorff ידוע.

### SVG

- viewBox תקין.
- paths סגורים.
- אין transforms.
- אין raster.
- fill-rule.
- round-trip parse.

## 17.2 Integration Tests

- upload → approved.
- upload → rejected בגלל ratio.
- upload → rejected בגלל topology.
- output files קיימים.
- הורדת קבצים.
- delete job.
- TTL cleanup.
- invalid filename download.
- concurrent requests.

## 17.3 Golden Tests

יש ליצור תיקיית fixture עם לפחות:

1. צמיד מלבני פשוט.
2. צמיד עם גל אורגני.
3. צמיד עם מספר פתחים.
4. צמיד עם אי פנימי.
5. צמיד עם גשר דק.
6. צמיד עם קצוות מעוגלים.
7. תמונה עם anti-aliasing.
8. תמונה עם רעש קל.
9. תמונה עם יחס שגוי.
10. תמונה שאמורה להידחות.

לכל fixture:

```text
input.png
expected_metadata.json
expected_topology.json
reference.svg
```

בדיקות golden לא צריכות לדרוש path data זהה, אלא:

- topology זהה.
- מדדים מעל הסף.
- גאומטריה תקינה.
- dimensions זהות.

## 17.4 End-to-End

Playwright:

1. העלאת תמונה.
2. הזנת מידות.
3. הפעלת המרה.
4. הצגת תוצאה.
5. הצגת metrics.
6. הורדת SVG.
7. טיפול בשגיאה.

---

# 18. קריטריוני קבלה

ה־MVP מאושר כאשר כל התנאים הבאים מתקיימים:

1. משתמש יכול להעלות PNG ולהגדיר מידות.
2. המערכת מפיקה `metal.svg` ו־`cutouts.svg`.
3. ה־viewBox שווה למידות שהוזנו.
4. כל paths סגורים.
5. אין self-intersections.
6. אין zero-area rings.
7. אין duplicate geometry.
8. היררכיית holes נשמרת.
9. מספר connected components נשמר.
10. ה־SVG עובר רינדור חוזר.
11. מחושב IoU.
12. מחושבות סטייה ממוצעת ומרבית.
13. נוצר difference image.
14. נוצר overlay.
15. candidate נבחר אוטומטית.
16. המערכת דוחה תוצאה שאינה עומדת בסף.
17. קבצים זמניים נמחקים אוטומטית.
18. כל בדיקות היחידה עוברות.
19. כל בדיקות האינטגרציה עוברות.
20. כל golden fixtures התקינים מקבלים `approved`.
21. fixture עם שינוי טופולוגי מקבל `rejected`.
22. המערכת עובדת מתוך Docker Compose.
23. README כולל הוראות הרצה מלאות.
24. אין צורך ב־GPU.
25. אין תלות חובה בשירות צד שלישי.

---

# 19. סדר מימוש עבור Claude Code

## שלב 1 — Scaffold

- צור repository לפי המבנה.
- הגדר backend ו־frontend.
- הוסף Docker Compose.
- הוסף health endpoint.
- הוסף linting ו־tests.

## שלב 2 — Upload ו־Validation

- מימוש upload.
- validation של PNG.
- validation של dimensions.
- יצירת job directory.
- result schema ראשוני.

## שלב 3 — Mask Pipeline

- grayscale.
- Otsu.
- dark/light role.
- raw mask.
- conservative cleanup.
- unit tests.

## שלב 4 — OpenCV Contour Prototype

- findContours.
- hierarchy.
- mapping למ"מ.
- SVG polygon output.
- round-trip rendering.
- metrics.

זהו fallback וגם baseline לפני שילוב VTracer.

## שלב 5 — VTracer Integration

- interface אחיד.
- VTracer adapter.
- parse output.
- cleanup.
- tests.

## שלב 6 — Candidate System

- threshold candidates.
- simplification candidates.
- scoring.
- selection.
- rejection.

## שלב 7 — Geometry Cleanup

- Shapely conversion.
- make_valid.
- union.
- holes.
- islands.
- cutouts difference.
- geometry assertions.

## שלב 8 — Output Assets

- metal.svg.
- cutouts.svg.
- rendered.png.
- difference.png.
- overlay.png.
- result.json.

## שלב 9 — Frontend

- form.
- upload.
- processing.
- tabs.
- metrics.
- downloads.
- error states.

## שלב 10 — Test Suite

- fixtures.
- golden tests.
- integration.
- E2E.
- benchmark.

## שלב 11 — Documentation

- README.
- API docs.
- architecture.
- limitations.
- local development.
- Docker deployment.

---

# 20. הוראות מחייבות ל־Claude Code

1. אין להרחיב את המוצר מעבר ל־MVP.
2. אין להוסיף מסד נתונים.
3. אין להוסיף מערכת משתמשים.
4. אין להשתמש ב־LLM.
5. אין להשתמש ב־Vectorizer.ai כברירת מחדל.
6. אין לבצע תיקוני עיצוב יצירתיים.
7. אין לבצע kerf compensation.
8. אין לשנות את יחס הממדים ללא אישור מפורש.
9. אין לאשר תוצאה ללא round-trip comparison.
10. אין לבחור candidate שאינו שומר topology.
11. יש לכתוב type hints מלאים ב־Python.
12. יש להימנע מ־`Any` ככל האפשר.
13. יש להוסיף docstrings לפונקציות ליבה.
14. יש להוסיף unit tests לכל מודול ליבה.
15. יש לשמור על functions קטנות ומודולריות.
16. יש להפריד בין image processing, geometry, rendering ו־metrics.
17. יש להוסיף error handling מפורש לכל subprocess.
18. יש להשתמש ב־temporary directories מבודדות.
19. יש לוודא שכל output filename קבוע ומאושר.
20. יש להפעיל formatter, linter ו־tests לפני סיום כל שלב.

---

# 21. Definition of Done

הפיתוח נחשב גמור כאשר:

```text
docker compose up --build
```

מעלה את המערכת, ולאחר מכן ניתן:

1. לפתוח את הממשק.
2. להעלות PNG דו־גוני.
3. להזין מידות.
4. לקבל SVG.
5. לראות overlay ו־difference.
6. לראות מדדי נאמנות.
7. להוריד את הקבצים.
8. לקבל דחייה ברורה במקרה שההמרה אינה אמינה.

בנוסף:

```text
make lint
make typecheck
make test
make e2e
```

חייבים לעבור בהצלחה.

---

# 22. שלב אימות לפני חיבור למנוע יצירת התמונות

לפני אינטגרציה עם מנוע יצירת התמונות, יש לבדוק לפחות 50 תמונות שונות:

- 10 עיצובים פשוטים.
- 10 עיצובים אורגניים.
- 10 עיצובים עם חורים.
- 10 עיצובים עם גשרים דקים.
- 10 עיצובים בעלי רמת מורכבות גבוהה.

יש לשמור לכל תמונה:

- תוצאת SVG.
- IoU.
- mean deviation.
- max deviation.
- topology result.
- זמן עיבוד.
- מספר anchor points.

המערכת מוכנה לאינטגרציה רק אם:

```text
לפחות 95% מהתמונות התקינות מקבלות approved
0% מהתוצאות עם topology שגויה מקבלות approved
זמן העיבוד החציוני קטן מ־10 שניות
```

---

# 23. הערכת עלויות MVP

## פיתוח

היקף משוער:

```text
60–110 שעות פיתוח
```

הטווח תלוי בעיקר ב:

- איכות שילוב VTracer.
- מורכבות הטופולוגיה.
- דיוק מדדי הסטייה.
- זמן בניית golden fixtures.
- רמת הגימור של הממשק.

טווח עלות חיצוני משוער:

```text
18,000–45,000 ₪
```

## תשתית

ל־MVP קטן:

```text
שרת CPU: 5–20 דולר לחודש
אחסון זמני: זניח
עלות המרה מקומית: כמעט אפס
```

אין צורך ב־GPU.

## שירות חיצוני אופציונלי בעתיד

Vectorizer.ai יכול להיכלל בעתיד כ־fallback בלבד, מאחורי אותו interface של `Tracer`.

אין לממש אותו כחלק חובה מה־MVP.

---

# 24. סיכום

המערכת אינה “ממיר SVG כללי”. היא מנוע ייעודי בעל חוזה קלט קשיח:

```text
תמונה דו־גונית נקייה של צמיד שטוח
+ מידות פיזיות
```

והיא נדרשת להחזיר:

```text
SVG תקין
+ הוכחה אוטומטית לנאמנות
+ דחייה כאשר אין ודאות מספקת
```

החלק החשוב ביותר במערכת אינו עצם יצירת ה־SVG, אלא מנגנון האימות:

```text
SVG
→ רינדור חזרה ל־PNG
→ השוואה למסכת המקור
→ בדיקת טופולוגיה
→ approve / reject
```

אין לאשר SVG על סמך תצוגה חזותית בלבד.
