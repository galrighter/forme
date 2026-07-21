-- שלב 1 — סכמה בסיסית. מקור: docs/BUILD_SPEC_studio_phase1.md סעיף 4.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- "בודק 1".."בודק 6"
  color text not null          -- צבע אווטאר לזיהוי מהיר
);

create table if not exists designs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  name text not null default 'עיצוב ללא שם',
  product_type text not null check (product_type in ('bracelet','ring')),
  length_mm numeric not null,
  width_mm numeric not null,
  gap_mm numeric not null,
  thickness_mm numeric not null default 1.5,
  current_version_id uuid,     -- FK ל-versions, מוגדר אחרי יצירת גרסה
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists design_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id) on delete cascade not null,
  version_no int not null,
  svg text not null,                    -- ה-SVG הקנוני
  source text not null check (source in ('generate','edit','auto_repair')),
  user_prompt text,
  annotation_png_path text,             -- Storage path, אם נשלח סימון
  validation_report jsonb not null,
  validation_status text not null check (validation_status in ('pass','warn','fail')),
  created_at timestamptz default now(),
  unique(design_id, version_no)
);

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id) not null,
  version_id uuid references design_versions(id) not null,
  dxf_path text not null,
  svg_path text not null,
  forced boolean not null default false, -- ייצוא שאושר למרות אזהרות
  created_at timestamptz default now()
);

create index if not exists idx_designs_profile on designs(profile_id);
create index if not exists idx_versions_design on design_versions(design_id);

-- RLS: אין גישת קליינט ישירה בשלב 1 — כל הגישה דרך service role שעוקף RLS.
-- מפעילים RLS בלי policies כדי שה-public key לא יחשוף כלום גם אם ידלוף.
alter table profiles enable row level security;
alter table designs enable row level security;
alter table design_versions enable row level security;
alter table exports enable row level security;

-- Seed: שישה בודקים גנריים
insert into profiles (name, color)
select v.name, v.color
from (values
  ('בודק 1', '#e05d5d'),
  ('בודק 2', '#e0a04d'),
  ('בודק 3', '#4da34d'),
  ('בודק 4', '#4d8fe0'),
  ('בודק 5', '#8a5de0'),
  ('בודק 6', '#d05da8')
) as v(name, color)
where not exists (select 1 from profiles);

-- Storage bucket: נוצר אוטומטית ע"י השרת בקריאה הראשונה (ensureBucket),
-- כי storage.buckets מנוהל ע"י Supabase Storage API ולא במיגרציה.
