-- אתר המותג — טבלת פניות/הזמנות (lead intake). נפרד מטבלאות הסטודיו כדי
-- שלא להתנגש בהן. מקור: docs/SITE.md.

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'order' check (kind in ('order','contact')),
  name text not null,
  email text not null,
  phone text,
  product_type text check (product_type in ('bracelet','ring')),
  message text not null,
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_inquiries_status on inquiries(status);
create index if not exists idx_inquiries_created on inquiries(created_at desc);
create index if not exists idx_inquiries_email on inquiries(email);

-- RLS: אין גישת קליינט ישירה — כל הגישה דרך service role שעוקף RLS.
-- מפעילים RLS בלי policies כדי שה-public key לא יחשוף כלום גם אם ידלוף.
alter table inquiries enable row level security;
