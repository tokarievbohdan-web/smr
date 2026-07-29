-- ============================================================
-- 022 · Milestone 4 — Opportunities & Applications: схема
-- Розширює opportunities/applications (006), додає типи/теги/історію/нотатки.
-- opportunities у prod порожня. business_status окремо від moderation.
-- ============================================================

-- ---------- enums ----------
do $$ begin create type opp_business_status as enum ('draft','active','paused','closed','expired','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type opp_moderation_status as enum ('not_submitted','pending','changes_required','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type remote_mode as enum ('onsite','remote','hybrid','not_applicable'); exception when duplicate_object then null; end $$;
do $$ begin create type opp_budget_visibility as enum ('public','on_request','not_specified'); exception when duplicate_object then null; end $$;
-- application_status enum уже існує (006): new/viewed/shortlisted/contacted/accepted/rejected/withdrawn

-- ---------- opportunity types (керований довідник) ----------
create table if not exists public.opportunity_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title_uk text not null, description_uk text,
  active boolean not null default true, sort_order int not null default 0,
  default_expiration_days int not null default 30, requires_budget boolean not null default false,
  allows_remote boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------- opportunities: нові колонки ----------
alter table public.opportunities add column if not exists slug text;
alter table public.opportunities add column if not exists opportunity_type_id uuid references public.opportunity_types(id) on delete set null;
alter table public.opportunities add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.opportunities add column if not exists contact_user_id uuid references public.profiles(id) on delete set null;
alter table public.opportunities add column if not exists sports text[] default '{}';
alter table public.opportunities add column if not exists professional_categories text[] default '{}';
alter table public.opportunities add column if not exists country text;
alter table public.opportunities add column if not exists region text;
alter table public.opportunities add column if not exists city text;
alter table public.opportunities add column if not exists remote_mode remote_mode not null default 'not_applicable';
alter table public.opportunities add column if not exists budget_vis opp_budget_visibility not null default 'not_specified';
alter table public.opportunities add column if not exists expected_format text;
alter table public.opportunities add column if not exists application_method text;      -- internal|external
alter table public.opportunities add column if not exists external_application_url text;
alter table public.opportunities add column if not exists application_deadline date;
alter table public.opportunities add column if not exists expiration_date date;
alter table public.opportunities add column if not exists business_status opp_business_status not null default 'draft';
alter table public.opportunities add column if not exists moderation opp_moderation_status not null default 'not_submitted';
alter table public.opportunities add column if not exists moderation_reason text;
alter table public.opportunities add column if not exists content_version int not null default 1;
alter table public.opportunities add column if not exists views_count int not null default 0;
alter table public.opportunities add column if not exists paused_at timestamptz;
alter table public.opportunities add column if not exists closed_at timestamptz;
alter table public.opportunities add column if not exists expired_at timestamptz;
alter table public.opportunities add column if not exists archived_at timestamptz;
alter table public.opportunities add column if not exists version int not null default 1;
alter table public.opportunities add column if not exists updated_at timestamptz not null default now();
create unique index if not exists uq_opportunities_slug on public.opportunities (slug) where deleted_at is null;

-- ---------- tags ----------
create table if not exists public.opportunity_tags (
  id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, active boolean not null default true
);
create table if not exists public.opportunity_tag_links (
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  tag_id uuid references public.opportunity_tags(id) on delete cascade,
  primary key (opportunity_id, tag_id)
);

-- ---------- applications: розширення ----------
alter table public.applications add column if not exists cover_message text;
alter table public.applications add column if not exists portfolio_url text;
alter table public.applications add column if not exists attachment_media_id uuid references public.media_files(id) on delete set null;
alter table public.applications add column if not exists applicant_snapshot jsonb;
alter table public.applications add column if not exists submitted_at timestamptz not null default now();
alter table public.applications add column if not exists viewed_at timestamptz;
alter table public.applications add column if not exists withdrawn_at timestamptz;
alter table public.applications add column if not exists version int not null default 1;
-- opp_id vs opportunity_id: у 006 колонка називається opp_id — лишаємо.

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  from_status application_status, to_status application_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_reason text, created_at timestamptz not null default now()
);

create table if not exists public.application_internal_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  author_user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

-- ---------- indexes ----------
create index if not exists idx_opps_public on public.opportunities (business_status, moderation, expiration_date) where deleted_at is null;
create index if not exists idx_opps_org on public.opportunities (org_id);
create index if not exists idx_opps_type on public.opportunities (opportunity_type_id);
create index if not exists idx_opps_deadline on public.opportunities (application_deadline) where deleted_at is null;
create index if not exists idx_opps_published2 on public.opportunities (published_at desc) where deleted_at is null;
create index if not exists idx_opps_sports on public.opportunities using gin (sports);
create index if not exists idx_opps_catg on public.opportunities using gin (professional_categories);
create index if not exists idx_apps_opp2 on public.applications (opp_id);
create index if not exists idx_apps_user2 on public.applications (user_id);
create index if not exists idx_apps_status on public.applications (status);
create index if not exists idx_ash_app on public.application_status_history (application_id);
create index if not exists idx_ain_app on public.application_internal_notes (application_id);

-- ---------- FTS ----------
alter table public.opportunities add column if not exists tsv tsvector generated always as (
  to_tsvector('simple', coalesce(title,'')||' '||coalesce(short_desc,'')||' '||coalesce(city,''))) stored;
create index if not exists idx_opps_tsv on public.opportunities using gin (tsv);
