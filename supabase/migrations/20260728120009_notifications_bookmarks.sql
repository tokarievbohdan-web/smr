-- ============================================================
-- 009 · Reports + bookmarks + notifications
-- ============================================================

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text,
  target_id   text,
  target_name text,
  reason      text,
  status      text not null default 'open',   -- open|reviewing|resolved|dismissed
  decision    text,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.bookmarks (
  user_id     uuid references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  type        text not null,
  title       text,
  body        text,
  entity_type text,
  entity_id   text,
  read        boolean not null default false,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);
