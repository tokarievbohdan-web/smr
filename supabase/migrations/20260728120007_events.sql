-- ============================================================
-- 007 · Events + registrations
-- Дата події — date; час — time; timezone зберігається явно.
-- ============================================================

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text,
  organizer   text,
  org_id      uuid references public.organizations(id) on delete set null,
  event_date  date,
  start_time  time,
  end_time    time,
  timezone    text default 'Europe/Kyiv',
  format      text,                             -- online|offline|hybrid
  city        text,
  venue       text,
  cost        text,
  is_paid     boolean not null default false,
  ticket_url  text,
  seats_total int,
  seats_left  int,
  reg_deadline date,
  short_desc  text,
  full_desc   text,
  cover       text,
  speakers    jsonb  default '[]'::jsonb,
  partners    text[] default '{}',
  tags        text[] default '{}',
  status      moderation_status not null default 'pending',
  featured    boolean not null default false,
  admin_notes text,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  status      registration_status not null default 'registered',
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id, user_id)
);
