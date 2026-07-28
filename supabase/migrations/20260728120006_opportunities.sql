-- ============================================================
-- 006 · Opportunities + applications
-- Автор подає на модерацію; публікацію/verified/featured робить лише адмін (014).
-- Дати — типізовані (date/timestamptz), не рядки.
-- ============================================================

create table if not exists public.opportunities (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text,
  org         text,
  org_id      uuid references public.organizations(id) on delete set null,
  author_id   uuid references public.profiles(id) on delete set null,
  sport       text,
  geography   text,
  format      text,
  professional_category text,
  budget_visibility text default 'public',   -- public|hidden|on_request
  budget_from bigint,
  budget_to   bigint,
  currency    text,
  budget      text,                            -- людський підпис (опційно)
  deadline    date,
  expires_at  timestamptz,
  published_at timestamptz,
  short_desc  text,
  full_desc   text,
  contact_method text,
  external_link  text,
  tags        text[] default '{}',
  status      moderation_status not null default 'pending',
  verified    boolean not null default false,   -- лише адмін
  featured    boolean not null default false,   -- лише адмін
  admin_notes text,
  applications_count int not null default 0,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  opp_id      uuid references public.opportunities(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  message     text,
  portfolio   text,
  attachment  text,
  status      application_status not null default 'new',
  note        text,                             -- нотатка автора можливості
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (opp_id, user_id)
);
