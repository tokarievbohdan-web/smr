-- ============================================================
-- 019 · Milestone 3 — Network: схема (профілі, організації, членство,
-- запити доступу, структурні дані). Розширює наявні profiles/organizations/
-- organization_members/access_requests. organizations у prod порожня.
-- ============================================================

-- ---------- enums ----------
do $$ begin create type verification_status as enum ('unverified','pending','verified','rejected','changes_required'); exception when duplicate_object then null; end $$;
do $$ begin create type org_moderation_status as enum ('draft','pending','changes_required','approved','rejected','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type member_role as enum ('owner','manager','editor','member'); exception when duplicate_object then null; end $$;
do $$ begin create type member_status as enum ('active','invited','removed'); exception when duplicate_object then null; end $$;
do $$ begin create type access_request_status as enum ('pending','under_review','information_required','approved','rejected','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type profile_visibility as enum ('public','authenticated_only','hidden'); exception when duplicate_object then null; end $$;
do $$ begin create type contact_visibility as enum ('public','authenticated_only','introduction_only','private'); exception when duplicate_object then null; end $$;
do $$ begin create type availability_status as enum ('open_to_work','open_to_projects','looking_for_partners','looking_for_investment','available_as_speaker','not_looking'); exception when duplicate_object then null; end $$;

-- ---------- organization types (керований довідник) ----------
create table if not exists public.organization_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, title text not null, "order" int not null default 0, active boolean not null default true
);

-- ============================================================
-- PROFILES: нові структуровані поля (замість неструктурованого profile jsonb
-- як джерела правди). profile jsonb лишаємо для legacy, нові поля — канонічні.
-- ============================================================
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_media_id uuid references public.media_files(id) on delete set null;
alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists current_position text;
alter table public.profiles add column if not exists current_organization_id uuid references public.organizations(id) on delete set null;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists languages text[] default '{}';
alter table public.profiles add column if not exists professional_categories text[] default '{}';
alter table public.profiles add column if not exists skills text[] default '{}';
alter table public.profiles add column if not exists availability_statuses text[] default '{}';
alter table public.profiles add column if not exists public_email text;
alter table public.profiles add column if not exists public_phone text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists other_social_links jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists contact_visibility contact_visibility not null default 'authenticated_only';
alter table public.profiles add column if not exists profile_visibility profile_visibility not null default 'public';
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists moderation_status text not null default 'active';
alter table public.profiles add column if not exists verification_status verification_status not null default 'unverified';
alter table public.profiles add column if not exists verification_note text;   -- причина changes/rejection (лише адмін бачить деталь через own/admin)
alter table public.profiles add column if not exists verification_submitted_at timestamptz;
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists version int not null default 1;

-- Структурні сутності профілю (окремі таблиці: незалежне редагування/сортування).
create table if not exists public.profile_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text, organization_name text, organization_id uuid references public.organizations(id) on delete set null,
  start_date date, end_date date, is_current boolean not null default false,
  description text, sort_order int not null default 0, is_public boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.profile_projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text, role text, organization_name text, url text, description text,
  sort_order int not null default 0, is_public boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.profile_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text, url text, media_id uuid references public.media_files(id) on delete set null, description text,
  sort_order int not null default 0, is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATIONS: нові поля (moderation окремо від verification, slug, тип-ref)
-- ============================================================
alter table public.organizations add column if not exists slug text;
alter table public.organizations add column if not exists normalized_name text;
alter table public.organizations add column if not exists organization_type_id uuid references public.organization_types(id) on delete set null;
alter table public.organizations add column if not exists logo_media_id uuid references public.media_files(id) on delete set null;
alter table public.organizations add column if not exists cover_media_id uuid references public.media_files(id) on delete set null;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists public_email text;
alter table public.organizations add column if not exists public_phone text;
alter table public.organizations add column if not exists social_links jsonb default '[]'::jsonb;
alter table public.organizations add column if not exists founded_year int;
alter table public.organizations add column if not exists team_size_range text;
alter table public.organizations add column if not exists audience_size text;
alter table public.organizations add column if not exists professional_categories text[] default '{}';
alter table public.organizations add column if not exists commercial_directions text[] default '{}';
alter table public.organizations add column if not exists moderation org_moderation_status not null default 'draft';
alter table public.organizations add column if not exists verification verification_status not null default 'unverified';
alter table public.organizations add column if not exists verified_at timestamptz;
alter table public.organizations add column if not exists verified_by uuid references public.profiles(id) on delete set null;
alter table public.organizations add column if not exists moderation_note text;
alter table public.organizations add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.organizations add column if not exists version int not null default 1;
create unique index if not exists uq_organizations_slug on public.organizations (slug) where deleted_at is null;
create index if not exists idx_organizations_normname on public.organizations (normalized_name);

create table if not exists public.organization_slug_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  old_slug text not null unique, created_at timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATION MEMBERS: роль/статус/посада (розширення)
-- ============================================================
alter table public.organization_members add column if not exists id uuid default gen_random_uuid();
alter table public.organization_members add column if not exists status member_status not null default 'active';
alter table public.organization_members add column if not exists job_title text;
alter table public.organization_members add column if not exists is_public boolean not null default true;
alter table public.organization_members add column if not exists joined_at timestamptz not null default now();
alter table public.organization_members add column if not exists updated_at timestamptz not null default now();
alter table public.organization_members add column if not exists deleted_at timestamptz;
-- role була text → member_role
do $$ begin
  if (select data_type from information_schema.columns where table_schema='public' and table_name='organization_members' and column_name='role')='text' then
    alter table public.organization_members alter column role drop default;
    alter table public.organization_members alter column role set data type member_role using (
      case lower(coalesce(role,'')) when 'owner' then 'owner' when 'manager' then 'manager' when 'editor' then 'editor' else 'member' end::member_role);
    alter table public.organization_members alter column role set default 'member'::member_role;
  end if;
end $$;

-- ============================================================
-- ACCESS REQUESTS: розширення до organization_access_requests
-- ============================================================
alter table public.access_requests add column if not exists requested_role member_role not null default 'member';
alter table public.access_requests add column if not exists job_title text;
alter table public.access_requests add column if not exists reason text;
alter table public.access_requests add column if not exists proof_url text;
alter table public.access_requests add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.access_requests add column if not exists review_note text;
alter table public.access_requests add column if not exists resolved_at timestamptz;
alter table public.access_requests add column if not exists updated_at timestamptz not null default now();
-- status text → access_request_status
do $$ begin
  if (select data_type from information_schema.columns where table_schema='public' and table_name='access_requests' and column_name='status')='text' then
    alter table public.access_requests alter column status drop default;
    alter table public.access_requests alter column status set data type access_request_status using (
      case lower(coalesce(status,'')) when 'approved' then 'approved' when 'rejected' then 'rejected'
        when 'cancelled' then 'cancelled' when 'under_review' then 'under_review'
        when 'information_required' then 'information_required' else 'pending' end::access_request_status);
    alter table public.access_requests alter column status set default 'pending'::access_request_status;
  end if;
end $$;
-- один активний запит на (org,user)
create unique index if not exists uq_access_active on public.access_requests (org_id, user_id)
  where status in ('pending','under_review','information_required');

-- ---------- indexes (directory/search) ----------
create index if not exists idx_profiles_verif on public.profiles (verification_status) where deleted_at is null;
create index if not exists idx_profiles_city on public.profiles (city) where deleted_at is null;
create index if not exists idx_profiles_skills on public.profiles using gin (skills);
create index if not exists idx_profiles_sports on public.profiles using gin (sports);
create index if not exists idx_profiles_catg on public.profiles using gin (professional_categories);
create index if not exists idx_profiles_avail on public.profiles using gin (availability_statuses);
create index if not exists idx_orgs_moderation on public.organizations (moderation) where deleted_at is null;
create index if not exists idx_orgs_type on public.organizations (organization_type_id);
create index if not exists idx_orgs_sports on public.organizations using gin (sports);
create index if not exists idx_members_user on public.organization_members (user_id) where deleted_at is null;
create index if not exists idx_members_org on public.organization_members (org_id) where deleted_at is null;
create index if not exists idx_access_org on public.access_requests (org_id, status);

-- ---------- FTS для directory-пошуку ----------
-- FTS по текстових полях; масиви (skills/sports/services) шукаються GIN-індексами вище.
alter table public.profiles add column if not exists tsv tsvector generated always as (
  to_tsvector('simple', coalesce(first_name,'')||' '||coalesce(last_name,'')||' '||coalesce(display_name,'')||' '||
    coalesce(headline,'')||' '||coalesce(current_position,'')||' '||coalesce(city,''))) stored;
create index if not exists idx_profiles_tsv on public.profiles using gin (tsv);
alter table public.organizations add column if not exists tsv tsvector generated always as (
  to_tsvector('simple', coalesce(name,'')||' '||coalesce(short_desc,'')||' '||coalesce(city,''))) stored;
create index if not exists idx_orgs_tsv on public.organizations using gin (tsv);
