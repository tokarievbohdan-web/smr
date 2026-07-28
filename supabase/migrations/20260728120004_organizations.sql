-- ============================================================
-- 004 · Organizations + members + access requests
-- verified / status керуються лише адміном (тригери у 014).
-- ============================================================

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text,
  city text, region text, country text,
  short_desc  text,
  full_desc   text,
  website     text,
  logo        text,
  cover       text,
  founded     text,
  audience    text,
  socials     jsonb  default '[]'::jsonb,
  contacts    jsonb  default '[]'::jsonb,     -- публічні контакти (за рішенням організації)
  services    text[] default '{}',
  directions  text[] default '{}',
  partners    text[] default '{}',
  sports      text[] default '{}',
  portfolio   jsonb  default '[]'::jsonb,
  status      moderation_status not null default 'pending',  -- публікація — лише модерація
  verified    boolean not null default false,                -- лише адмін
  featured    boolean not null default false,                -- лише адмін
  admin_notes text,
  owner_id    uuid references public.profiles(id) on delete set null,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id     uuid references public.organizations(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text not null default 'manager',   -- manager|owner|editor
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.access_requests (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text,
  status     text not null default 'new',    -- new|approved|declined
  created_at timestamptz not null default now()
);
