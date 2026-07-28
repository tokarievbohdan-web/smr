-- ============================================================
-- 012 · RLS: enable + policies
-- Принципи:
--  · profiles — базова таблиця закрита (self/admin). Публічний перегляд —
--    лише через view public_profiles (013), без email/приватних полів.
--  · Контент (orgs/articles/opps/events) — авторизований може читати
--    published & not deleted; анонім — через public views (013).
--  · Захист колонок (verified/status/featured/admin_notes) — тригери у 014.
-- ============================================================

-- ---------- enable RLS ----------
alter table public.admin_users          enable row level security;
alter table public.profiles             enable row level security;
alter table public.taxonomies           enable row level security;
alter table public.article_categories   enable row level security;
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.access_requests      enable row level security;
alter table public.articles             enable row level security;
alter table public.opportunities        enable row level security;
alter table public.applications         enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.introductions        enable row level security;
alter table public.reports              enable row level security;
alter table public.bookmarks            enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_log            enable row level security;
alter table public.analytics_events     enable row level security;

-- ---------- ADMIN USERS ----------
drop policy if exists "admins: self read"  on public.admin_users;
create policy "admins: self read" on public.admin_users
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admins: super write" on public.admin_users;
create policy "admins: super write" on public.admin_users
  for all using (public.has_admin_role('super_admin'))
  with check (public.has_admin_role('super_admin'));

-- ---------- PROFILES ----------
-- Базова таблиця: лише власник і адмін. Жодного публічного select напряму
-- (email та settings не повинні витікати). Публіка — через public_profiles.
drop policy if exists "profiles: own read"      on public.profiles;
drop policy if exists "profiles: self/admin read" on public.profiles;
create policy "profiles: self/admin read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: self insert"   on public.profiles;
create policy "profiles: self insert" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles: self update"   on public.profiles;
-- Запис лише власник або moderator+ (super_admin автоматично). analyst/editor/
-- event_manager/partnership_manager НЕ можуть змінювати чужі профілі.
create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid() or public.has_admin_role('moderator'));
-- (Захищені колонки не даємо міняти навіть власнику — тригер guard_profiles у 014.)

-- ---------- TAXONOMIES / CATEGORIES ----------
drop policy if exists "tax: read all"   on public.taxonomies;
create policy "tax: read all" on public.taxonomies for select using (true);
drop policy if exists "tax: admin write" on public.taxonomies;
create policy "tax: admin write" on public.taxonomies
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cats: read all"    on public.article_categories;
create policy "cats: read all" on public.article_categories for select using (true);
drop policy if exists "cats: editor write" on public.article_categories;
create policy "cats: editor write" on public.article_categories
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- ORGANIZATIONS ----------
drop policy if exists "orgs: read published" on public.organizations;
create policy "orgs: read published" on public.organizations
  for select using (
    (deleted_at is null and (status = 'published' or verified))
    or owner_id = auth.uid()
    or public.is_admin()
    or public.is_org_member(id)     -- SECURITY DEFINER helper: без рекурсії RLS
  );
drop policy if exists "orgs: owner/admin write" on public.organizations;
create policy "orgs: owner/admin write" on public.organizations
  for all using (owner_id = auth.uid() or public.has_admin_role('moderator'))
  with check (owner_id = auth.uid() or public.has_admin_role('moderator'));

drop policy if exists "org_members: read" on public.organization_members;
create policy "org_members: read" on public.organization_members
  for select using (user_id = auth.uid() or public.is_admin() or public.is_org_owner(org_id));
drop policy if exists "org_members: owner/admin write" on public.organization_members;
create policy "org_members: owner/admin write" on public.organization_members
  for all using (public.is_admin() or public.is_org_owner(org_id))
  with check (public.is_admin() or public.is_org_owner(org_id));

drop policy if exists "access_req: own/admin" on public.access_requests;
create policy "access_req: own/admin" on public.access_requests
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------- ARTICLES ----------
drop policy if exists "articles: read published" on public.articles;
create policy "articles: read published" on public.articles
  for select using ((deleted_at is null and status = 'published') or public.is_admin());
drop policy if exists "articles: editor write" on public.articles;
create policy "articles: editor write" on public.articles
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- OPPORTUNITIES ----------
drop policy if exists "opps: read published" on public.opportunities;
create policy "opps: read published" on public.opportunities
  for select using (
    (deleted_at is null and status = 'published')
    or author_id = auth.uid()
    or public.is_admin()
  );
drop policy if exists "opps: author write" on public.opportunities;
create policy "opps: author write" on public.opportunities
  for all using (author_id = auth.uid() or public.has_admin_role('moderator'))
  with check (author_id = auth.uid() or public.has_admin_role('moderator'));

drop policy if exists "apps: applicant or opp author" on public.applications;
create policy "apps: applicant or opp author" on public.applications
  for select using (
    user_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.opportunities o where o.id = opp_id and o.author_id = auth.uid()));
drop policy if exists "apps: applicant insert" on public.applications;
create policy "apps: applicant insert" on public.applications
  for insert with check (user_id = auth.uid());
drop policy if exists "apps: applicant/author update" on public.applications;
create policy "apps: applicant/author update" on public.applications
  for update using (
    user_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.opportunities o where o.id = opp_id and o.author_id = auth.uid()));

-- ---------- EVENTS ----------
drop policy if exists "events: read published" on public.events;
create policy "events: read published" on public.events
  for select using ((deleted_at is null and status = 'published') or public.is_admin());
drop policy if exists "events: admin/em write" on public.events;
create policy "events: admin/em write" on public.events
  for all using (public.has_admin_role('event_manager')) with check (public.has_admin_role('event_manager'));

drop policy if exists "regs: own/admin" on public.event_registrations;
create policy "regs: own/admin" on public.event_registrations
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- ---------- INTRODUCTIONS ----------
drop policy if exists "intros: requester/pm"        on public.introductions;
create policy "intros: requester/pm" on public.introductions
  for select using (requester_id = auth.uid() or public.has_admin_role('partnership_manager'));
drop policy if exists "intros: requester insert"    on public.introductions;
create policy "intros: requester insert" on public.introductions
  for insert with check (requester_id = auth.uid());
drop policy if exists "intros: requester/pm update" on public.introductions;
create policy "intros: requester/pm update" on public.introductions
  for update using (requester_id = auth.uid() or public.has_admin_role('partnership_manager'));

-- ---------- REPORTS ----------
drop policy if exists "reports: reporter insert"  on public.reports;
create policy "reports: reporter insert" on public.reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists "reports: moderator read"   on public.reports;
create policy "reports: moderator read" on public.reports
  for select using (reporter_id = auth.uid() or public.has_admin_role('moderator'));
drop policy if exists "reports: moderator update" on public.reports;
create policy "reports: moderator update" on public.reports
  for update using (public.has_admin_role('moderator'));

-- ---------- BOOKMARKS / NOTIFICATIONS ----------
drop policy if exists "bookmarks: own" on public.bookmarks;
create policy "bookmarks: own" on public.bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifs: own" on public.notifications;
create policy "notifs: own" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- AUDIT (immutable для клієнта) ----------
drop policy if exists "audit: admin read"   on public.audit_log;
create policy "audit: admin read" on public.audit_log
  for select using (public.is_admin());
-- Немає insert/update/delete політик → клієнт не пише й не змінює.
-- Запис виконують SECURITY DEFINER RPC (014), які працюють від власника й
-- оминають RLS.

-- ---------- ANALYTICS ----------
drop policy if exists "analytics: self insert" on public.analytics_events;
create policy "analytics: self insert" on public.analytics_events
  for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "analytics: analyst read" on public.analytics_events;
create policy "analytics: analyst read" on public.analytics_events
  for select using (public.has_admin_role('analyst'));
