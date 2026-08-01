-- ============================================================
-- 020 · Milestone 3 — Network: RLS, public views (privacy на сервері),
-- org-хелпери, тригери-барʼєри нових захищених полів.
-- ============================================================

alter table public.profiles              enable row level security; -- вже, ідемпотентно
alter table public.organization_types    enable row level security;
alter table public.profile_experience    enable row level security;
alter table public.profile_projects      enable row level security;
alter table public.profile_portfolio_items enable row level security;
alter table public.organization_slug_history enable row level security;

-- avatar/logo як URL (як cover у статтях) — для простого public-рендеру
alter table public.profiles add column if not exists avatar text;

-- ---------- org helpers (SECURITY DEFINER: без рекурсії RLS) ----------
create or replace function public.is_org_public(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizations o where o.id = p_org and o.deleted_at is null and o.moderation = 'approved');
$$;
create or replace function public.is_org_editor(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager','editor'));
$$;
create or replace function public.is_org_manager(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager'));
$$;
revoke all on function public.is_org_public(uuid), public.is_org_editor(uuid), public.is_org_manager(uuid) from public;
grant execute on function public.is_org_public(uuid), public.is_org_editor(uuid), public.is_org_manager(uuid) to anon, authenticated, service_role;

-- ---------- organization_types ----------
drop policy if exists "orgtypes: read" on public.organization_types;
create policy "orgtypes: read" on public.organization_types for select using (true);
drop policy if exists "orgtypes: admin write" on public.organization_types;
create policy "orgtypes: admin write" on public.organization_types for all using (public.is_admin()) with check (public.is_admin());

-- ---------- profile structural tables ----------
drop policy if exists "pexp: read" on public.profile_experience;
create policy "pexp: read" on public.profile_experience for select using (is_public or profile_id = auth.uid() or public.is_admin());
drop policy if exists "pexp: own write" on public.profile_experience;
create policy "pexp: own write" on public.profile_experience for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "pproj: read" on public.profile_projects;
create policy "pproj: read" on public.profile_projects for select using (is_public or profile_id = auth.uid() or public.is_admin());
drop policy if exists "pproj: own write" on public.profile_projects;
create policy "pproj: own write" on public.profile_projects for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "pport: read" on public.profile_portfolio_items;
create policy "pport: read" on public.profile_portfolio_items for select using (is_public or profile_id = auth.uid() or public.is_admin());
drop policy if exists "pport: own write" on public.profile_portfolio_items;
create policy "pport: own write" on public.profile_portfolio_items for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

-- ---------- org slug history ----------
drop policy if exists "org_slug: read" on public.organization_slug_history;
create policy "org_slug: read" on public.organization_slug_history for select using (true);

-- ---------- organizations write: owner/editor/admin ----------
drop policy if exists "orgs: owner/admin write" on public.organizations;
drop policy if exists "orgs: owner/editor/admin write" on public.organizations;
create policy "orgs: owner/editor/admin write" on public.organizations
  for all using (owner_id = auth.uid() or public.is_org_editor(id) or public.has_admin_role('moderator'))
  with check (owner_id = auth.uid() or public.is_org_editor(id) or public.has_admin_role('moderator'));
-- read: approved (public) або власні/член/адмін
drop policy if exists "orgs: read published" on public.organizations;
drop policy if exists "orgs: read network" on public.organizations;
create policy "orgs: read network" on public.organizations
  for select using (
    (deleted_at is null and moderation = 'approved')
    or owner_id = auth.uid() or public.is_admin() or public.is_org_member(id)
  );

-- ---------- organization_members read: публічні активні члени approved-орг ----------
drop policy if exists "org_members: read" on public.organization_members;
drop policy if exists "org_members: read" on public.organization_members;
create policy "org_members: read" on public.organization_members
  for select using (
    user_id = auth.uid() or public.is_admin() or public.is_org_owner(org_id)
    or (is_public and status = 'active' and public.is_org_public(org_id))
  );
drop policy if exists "org_members: owner/admin write" on public.organization_members;
drop policy if exists "org_members: manager/admin write" on public.organization_members;
create policy "org_members: manager/admin write" on public.organization_members
  for all using (public.is_admin() or public.is_org_manager(org_id))
  with check (public.is_admin() or public.is_org_manager(org_id));

-- ---------- access_requests: власник запиту / адмін / власник-менеджер орг ----------
drop policy if exists "access_req: own/admin" on public.access_requests;
drop policy if exists "access_req: read" on public.access_requests;
create policy "access_req: read" on public.access_requests
  for select using (user_id = auth.uid() or public.is_admin() or public.is_org_manager(org_id));
drop policy if exists "access_req: requester insert" on public.access_requests;
drop policy if exists "access_req: requester insert" on public.access_requests;
create policy "access_req: requester insert" on public.access_requests
  for insert with check (user_id = auth.uid());
drop policy if exists "access_req: requester cancel" on public.access_requests;
drop policy if exists "access_req: requester update" on public.access_requests;
create policy "access_req: requester update" on public.access_requests
  for update using (user_id = auth.uid() or public.is_admin() or public.is_org_manager(org_id));

-- ============================================================
-- PUBLIC VIEWS (privacy на сервері)
-- ============================================================
drop view if exists public.public_profiles;
create view public.public_profiles as
  select
    p.id,
    coalesce(p.display_name, nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')) as display_name,
    p.avatar, p.headline, p.current_position, p.current_organization_id,
    p.city, p.region, p.country, p.bio,
    p.sports, p.professional_categories, p.skills, p.availability_statuses, p.languages,
    p.website, p.linkedin_url, p.other_social_links,
    (p.verification_status = 'verified') as verified,
    -- контакти лише за політикою видимості (private/introduction_only → null)
    case when p.contact_visibility = 'public'
              or (p.contact_visibility = 'authenticated_only' and auth.uid() is not null)
         then p.public_email else null end as public_email,
    case when p.contact_visibility = 'public'
              or (p.contact_visibility = 'authenticated_only' and auth.uid() is not null)
         then p.public_phone else null end as public_phone,
    p.contact_visibility, p.created_at
  from public.profiles p
  where p.deleted_at is null
    and p.moderation_status = 'active'
    and (p.profile_visibility = 'public'
         or (p.profile_visibility = 'authenticated_only' and auth.uid() is not null));

drop view if exists public.public_organizations;
create view public.public_organizations as
  select
    o.id, o.name, o.slug, o.organization_type_id, t.code as type_code, t.title as type_title,
    o.city, o.region, o.country, o.address,
    o.short_desc, o.full_desc, o.website, o.logo, o.cover, o.founded, o.founded_year, o.audience, o.team_size_range, o.audience_size,
    o.public_email, o.public_phone, o.social_links,
    o.services, o.directions, o.commercial_directions, o.professional_categories, o.partners, o.sports, o.portfolio,
    (o.verification = 'verified') as verified, o.featured, o.created_at, o.updated_at
  from public.organizations o
  left join public.organization_types t on t.id = o.organization_type_id
  where o.deleted_at is null and o.moderation = 'approved';

grant select on public.public_profiles      to anon, authenticated;
grant select on public.public_organizations  to anon, authenticated;

-- ============================================================
-- ТРИГЕРИ-БАРʼЄРИ: розширюємо захист профілю й організації
-- ============================================================
create or replace function public.guard_profiles_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_admin_role('moderator') or current_setting('app.privileged_write', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    new.verified := false; new.admin_notes := null; new.deleted_at := null;
    if new.status not in ('active','pending') then new.status := 'active'; end if;
    new.verification_status := 'unverified'; new.moderation_status := 'active';
    new.verified_at := null; new.verified_by := null; new.verification_note := null; new.verification_submitted_at := null;
    new.version := 1;
  else
    new.verified := old.verified; new.status := old.status; new.email := old.email;
    new.admin_notes := old.admin_notes; new.deleted_at := old.deleted_at;
    new.verification_status := old.verification_status; new.moderation_status := old.moderation_status;
    new.verified_at := old.verified_at; new.verified_by := old.verified_by;
    new.verification_note := old.verification_note; new.verification_submitted_at := old.verification_submitted_at;
    new.version := old.version + 1;
  end if;
  return new;
end $$;

create or replace function public.guard_orgs_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_admin_role('moderator') or current_setting('app.privileged_write', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    new.verified := false; new.featured := false; new.admin_notes := null; new.deleted_at := null;
    new.moderation := 'draft'; new.verification := 'unverified';
    if new.status is null or new.status not in ('draft','pending') then new.status := 'pending'; end if;  -- легасі-колонка: публікацію робить лише модерація
    new.verified_at := null; new.verified_by := null; new.moderation_note := null;
    new.created_by := auth.uid(); new.owner_id := coalesce(new.owner_id, auth.uid());
    new.version := 1;
  else
    new.verified := old.verified; new.featured := old.featured; new.admin_notes := old.admin_notes;
    new.deleted_at := old.deleted_at; new.owner_id := old.owner_id; new.created_by := old.created_by;
    if new.status is distinct from old.status and new.status not in ('draft','pending','paused','closed') then new.status := old.status; end if;
    new.moderation := old.moderation; new.verification := old.verification;
    new.verified_at := old.verified_at; new.verified_by := old.verified_by; new.moderation_note := old.moderation_note;
    new.slug := old.slug;
    new.version := old.version + 1;
  end if;
  return new;
end $$;

-- updated_at для нових таблиць
do $$ begin
  create trigger t_pexp_touch before update on public.profile_experience for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_pproj_touch before update on public.profile_projects for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_members_touch before update on public.organization_members for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_access_touch before update on public.access_requests for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
