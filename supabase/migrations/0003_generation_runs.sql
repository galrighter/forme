-- יומן הרצות הצינור (image→SVG) לבק־אופיס. שומר כל הרצה — הצלחה, דחייה או שגיאה —
-- עם כל שלבי הביניים, כדי שנוכל לאבחן תלונות ולכייל את איכות ההמרה יחד.
-- נפרד מ-design_versions: גרסה נשמרת רק בהצלחה ומצריכה עיצוב; כאן שומרים גם כשלים.
--
-- הערה תפעולית: ה-migrate workflow חייב SUPABASE_DB_URL של ה-Session pooler
-- (host: *.pooler.supabase.com, IPv4). החיבור הישיר (db.<ref>.supabase.co) הוא
-- IPv6-only ו-runners של GitHub Actions לא מגיעים אליו ("Network is unreachable").

create table if not exists generation_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- 'studio' (מסלול המשתמש) | 'debug' (בק־אופיס) | 'upload' (המרת תמונה ידנית)
  source text not null check (source in ('studio', 'debug', 'upload')),
  design_id uuid references designs(id) on delete set null,
  product_type text check (product_type in ('bracelet', 'ring')),
  prompt text,
  color_key text,
  -- 'approved' (עבר את השער) | 'rejected' (נדחה בשער נאמנות/טופולוגיה) | 'error' (כשל טכני)
  status text not null check (status in ('approved', 'rejected', 'error')),
  error text,
  duration_ms integer,
  render_model text,
  render_path text,                          -- נתיב ההדמיה (או התמונה שהועלתה) ב-storage
  stage_paths jsonb not null default '{}',   -- { conditioned, overlay, difference, rendered }
  svg text,                                  -- ה-cutouts SVG הסופי (אם אושר)
  metrics jsonb,                             -- { iou, holes, meanDeviationMm, maxDeviationMm }
  debug jsonb                                -- { stages, candidates, gates, warnings, color_key, width_mm, height_mm }
);

create index if not exists idx_generation_runs_created on generation_runs(created_at desc);
create index if not exists idx_generation_runs_status on generation_runs(status);
create index if not exists idx_generation_runs_design on generation_runs(design_id);

-- RLS: אין גישת קליינט ישירה — הכול דרך service role שעוקף RLS.
alter table generation_runs enable row level security;

-- re-trigger: apply generation_runs via the Session pooler (see header).
