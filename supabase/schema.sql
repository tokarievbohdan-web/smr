-- ============================================================
-- Sport Market Review — схема бази даних (Supabase / Postgres)
-- Запустити у Supabase Dashboard → SQL Editor.
-- Покриває сутності мобільного застосунку + основу для адмінки.
-- RLS увімкнено на всіх таблицях.
-- ============================================================

-- ---------- ENUM-и ----------
do $$ begin
  create type account_status as enum ('active','pending','suspended','blocked','deleted');
exception when duplicate_object then null; end $$;
do $$ begin
  create type platform_role as enum ('specialist','org_rep','student','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type moderation_status as enum ('draft','pending','review','changes','published','scheduled','paused','closed','rejected','expired','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type application_status as enum ('new','viewed','shortlisted','contacted','accepted','rejected','withdrawn');
exception when duplicate_object then null; end $$;
do $$ begin
  create type registration_status as enum ('registered','waitlist','cancelled','attended','noshow');
exception when duplicate_object then null; end $$;
do $$ begin
  create type intro_status as enum ('new','review','moreinfo','approved','sent','declined','closed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type admin_role as enum ('super_admin','editor','moderator','partnership_manager','event_manager','analyst');
exception when duplicate_object then null; end $$;

-- ---------- ADMIN USERS (створюємо рано: на них посилаються функції та FK) ----------
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null, name text, role admin_role not null default 'moderator',
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
-- Чи є поточний користувач адміністратором (для доступу з адмінки).
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists(select 1 from public.admin_users a where a.id = auth.uid());
$$;
create or replace function public.has_admin_role(r admin_role) returns boolean language sql stable as $$
  select exists(select 1 from public.admin_users a where a.id = auth.uid() and (a.role = 'super_admin' or a.role = r));
$$;

-- ---------- PROFILES (1:1 з auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  status account_status not null default 'active',
  email_confirmed boolean not null default false,
  verified boolean not null default false,
  user_type text,
  sports text[] default '{}',
  directions text[] default '{}',
  content_categories text[] default '{}',
  goals text[] default '{}',
  availability text[] default '{}',
  profile jsonb default '{}'::jsonb,      -- {firstName,lastName,position,org,city,bio,photo,portfolio}
  settings jsonb default '{}'::jsonb,     -- {language,privacyPublic,contactsPublic,emailNotifications}
  onboarding_step int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: own read" on public.profiles for select using (id = auth.uid() or coalesce((settings->>'privacyPublic')::boolean, true) or public.is_admin());
create policy "profiles: self insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles: self update" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- ---------- ORGANIZATIONS ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  city text, region text, country text,
  short_desc text, full_desc text,
  website text, founded text, audience text,
  socials jsonb default '[]'::jsonb, contacts jsonb default '[]'::jsonb,
  services text[] default '{}', directions text[] default '{}', partners text[] default '{}',
  sports text[] default '{}',
  status moderation_status not null default 'pending',
  verified boolean not null default false,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;
create policy "orgs: read published" on public.organizations for select using (status='published' or verified or owner_id = auth.uid() or public.is_admin());
create policy "orgs: owner/admin write" on public.organizations for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create table if not exists public.organization_members (
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'manager',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
alter table public.organization_members enable row level security;
create policy "org_members: read" on public.organization_members for select using (user_id = auth.uid() or public.is_admin());

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text, status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.access_requests enable row level security;
create policy "access_req: own/admin" on public.access_requests for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- ---------- REVIEW / CMS ----------
create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(), title text not null, slug text, "order" int default 0, active boolean default true
);
alter table public.article_categories enable row level security;
create policy "cats: read all" on public.article_categories for select using (true);
create policy "cats: editor write" on public.article_categories for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  type text, category text, title text not null, subtitle text, excerpt text,
  body jsonb default '[]'::jsonb, cover text, author jsonb,
  status moderation_status not null default 'draft',
  featured boolean default false, home_order int default 0,
  views int default 0, saves int default 0,
  related jsonb default '{}'::jsonb, seo jsonb default '{}'::jsonb,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.articles enable row level security;
create policy "articles: read published" on public.articles for select using (status='published' or public.is_admin());
create policy "articles: editor write" on public.articles for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- OPPORTUNITIES ----------
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null, type text, org text, org_id uuid references public.organizations(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  sport text, geography text, format text, professional_category text,
  budget_visibility text, budget_from bigint, budget_to bigint, currency text, budget text,
  deadline text, expires_at text, published_at text,
  short_desc text, full_desc text, contact_method text, external_link text, tags text[] default '{}',
  status moderation_status not null default 'pending',
  verified boolean default false, featured boolean default false,
  applications_count int default 0,
  created_at timestamptz not null default now()
);
alter table public.opportunities enable row level security;
create policy "opps: read published" on public.opportunities for select using (status='published' or author_id = auth.uid() or public.is_admin());
create policy "opps: author write" on public.opportunities for all using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  opp_id uuid references public.opportunities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  message text, portfolio text, attachment text,
  status application_status not null default 'new',
  note text, created_at timestamptz not null default now(),
  unique(opp_id, user_id)
);
alter table public.applications enable row level security;
create policy "apps: applicant or opp author" on public.applications for select using (
  user_id = auth.uid() or public.is_admin() or exists(select 1 from public.opportunities o where o.id = opp_id and o.author_id = auth.uid()));
create policy "apps: applicant insert" on public.applications for insert with check (user_id = auth.uid());
create policy "apps: applicant/author update" on public.applications for update using (
  user_id = auth.uid() or public.is_admin() or exists(select 1 from public.opportunities o where o.id = opp_id and o.author_id = auth.uid()));

-- ---------- EVENTS ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, type text, organizer text, org_id uuid references public.organizations(id) on delete set null,
  date text, "time" text, timezone text, format text, city text, venue text,
  cost text, is_paid boolean default false, ticket_url text,
  seats_total int, seats_left int, reg_deadline text,
  short_desc text, full_desc text, cover text,
  speakers jsonb default '[]'::jsonb, partners text[] default '{}', tags text[] default '{}',
  status moderation_status not null default 'pending', featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "events: read published" on public.events for select using (status='published' or public.is_admin());
create policy "events: admin/em write" on public.events for all using (public.has_admin_role('event_manager')) with check (public.has_admin_role('event_manager'));

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status registration_status not null default 'registered',
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);
alter table public.event_registrations enable row level security;
create policy "regs: own/admin" on public.event_registrations for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());

-- ---------- INTRODUCTIONS ----------
create table if not exists public.introductions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  target_type text, target_id text, target_name text, target_role text,
  reason text, context text, expected_result text,
  related_type text, related_id text, related_label text,
  consent boolean default false,
  status intro_status not null default 'new',
  info_request text, info_response text,
  manager_id uuid references public.admin_users(id) on delete set null,
  priority text default 'med',
  history jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.introductions enable row level security;
create policy "intros: requester/pm" on public.introductions for select using (requester_id = auth.uid() or public.has_admin_role('partnership_manager'));
create policy "intros: requester insert" on public.introductions for insert with check (requester_id = auth.uid());
create policy "intros: requester/pm update" on public.introductions for update using (requester_id = auth.uid() or public.has_admin_role('partnership_manager'));

-- ---------- REPORTS ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text, target_id text, target_name text, reason text,
  status text not null default 'open', decision text,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports: reporter insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports: moderator read" on public.reports for select using (reporter_id = auth.uid() or public.has_admin_role('moderator'));
create policy "reports: moderator update" on public.reports for update using (public.has_admin_role('moderator'));

-- ---------- BOOKMARKS ----------
create table if not exists public.bookmarks (
  user_id uuid references public.profiles(id) on delete cascade,
  entity_type text not null, entity_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);
alter table public.bookmarks enable row level security;
create policy "bookmarks: own" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null, title text, body text,
  entity_type text, entity_id text, read boolean default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifs: own" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- TAXONOMIES ----------
create table if not exists public.taxonomies (
  id uuid primary key default gen_random_uuid(),
  kind text not null,          -- 'sport','direction','skill','org_type','opp_type','event_type','content_category','tag','region','city','language'
  value text not null, active boolean default true, "order" int default 0
);
alter table public.taxonomies enable row level security;
create policy "tax: read all" on public.taxonomies for select using (true);
create policy "tax: admin write" on public.taxonomies for all using (public.is_admin()) with check (public.is_admin());

-- ---------- ADMIN (RLS для admin_users — функції вже створені вище) ----------
alter table public.admin_users enable row level security;
create policy "admins: self read" on public.admin_users for select using (id = auth.uid() or public.is_admin());
create policy "admins: super write" on public.admin_users for all using (public.has_admin_role('super_admin')) with check (public.has_admin_role('super_admin'));

create table if not exists public.audit_log (
  id bigserial primary key,
  actor uuid references public.admin_users(id) on delete set null,
  actor_email text, role text, action text, target text,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit: admin read" on public.audit_log for select using (public.is_admin());
create policy "audit: admin insert" on public.audit_log for insert with check (public.is_admin());

create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event text not null, props jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
create policy "analytics: self insert" on public.analytics_events for insert with check (user_id = auth.uid() or user_id is null);
create policy "analytics: analyst read" on public.analytics_events for select using (public.has_admin_role('analyst'));

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ begin
  create trigger t_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
  create trigger t_articles_touch before update on public.articles for each row execute function public.touch_updated_at();
  create trigger t_intros_touch before update on public.introductions for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- Готово. Далі: увімкнути Email OTP (Auth → Providers → Email),
-- за потреби наповнити article_categories/taxonomies, і вставити
-- перших адмінів у public.admin_users (id = auth.users.id).
-- ============================================================
