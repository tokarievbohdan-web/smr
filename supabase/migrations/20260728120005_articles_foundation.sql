-- ============================================================
-- 005 · Articles foundation
-- body — версіонований документ { version, blocks[] } (див. contracts/articleBody).
-- content_version дублює body->>'version' для індексації/міграцій формату.
-- UI до Supabase на цьому етапі НЕ підключається (Milestone 2).
-- ============================================================

create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  type        text,
  category    text,
  title       text not null,
  subtitle    text,
  excerpt     text,
  body        jsonb not null default '{"version":1,"blocks":[]}'::jsonb,
  content_version int not null default 1,
  cover       text,
  author      jsonb,
  status      moderation_status not null default 'draft',
  featured    boolean not null default false,   -- лише staff (editor)
  home_order  int not null default 0,
  views       int not null default 0,
  saves       int not null default 0,
  related     jsonb default '{}'::jsonb,
  seo         jsonb default '{}'::jsonb,
  admin_notes text,
  published_at timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Тіло статті завжди має бути об'єктом із version+blocks (мінімальний контракт на рівні БД).
do $$ begin
  alter table public.articles
    add constraint articles_body_shape
    check (jsonb_typeof(body) = 'object'
           and body ? 'version'
           and jsonb_typeof(body->'blocks') = 'array');
exception when duplicate_object then null; end $$;
