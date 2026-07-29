-- ============================================================
-- 023 · Milestone 4 — Opportunities/Applications: RLS, view, guards
-- ============================================================

alter table public.opportunity_types          enable row level security;
alter table public.opportunity_tags           enable row level security;
alter table public.opportunity_tag_links      enable row level security;
alter table public.application_status_history enable row level security;
alter table public.application_internal_notes enable row level security;

-- ---------- helpers ----------
create or replace function public.opp_org(p_opp uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.opportunities where id = p_opp;
$$;
create or replace function public.is_opp_manager(p_opp uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_manager(public.opp_org(p_opp));
$$;
create or replace function public.is_opp_editor(p_opp uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_editor(public.opp_org(p_opp));
$$;
create or replace function public.is_opp_public(p_opp uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.opportunities o
    where o.id = p_opp and o.deleted_at is null and o.business_status = 'active' and o.moderation = 'approved'
      and o.published_at is not null and o.published_at <= now()
      and (o.expiration_date is null or o.expiration_date >= current_date)
      and public.is_org_public(o.org_id));
$$;
revoke all on function public.opp_org(uuid), public.is_opp_manager(uuid), public.is_opp_editor(uuid), public.is_opp_public(uuid) from public;
grant execute on function public.opp_org(uuid), public.is_opp_manager(uuid), public.is_opp_editor(uuid), public.is_opp_public(uuid) to anon, authenticated, service_role;

-- ---------- opportunity_types / tags ----------
drop policy if exists "otypes: read" on public.opportunity_types;
create policy "otypes: read" on public.opportunity_types for select using (true);
drop policy if exists "otypes: admin write" on public.opportunity_types;
create policy "otypes: admin write" on public.opportunity_types for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "otags: read" on public.opportunity_tags;
create policy "otags: read" on public.opportunity_tags for select using (true);
drop policy if exists "otags: auth write" on public.opportunity_tags;
create policy "otags: auth write" on public.opportunity_tags for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "otaglinks: read" on public.opportunity_tag_links;
create policy "otaglinks: read" on public.opportunity_tag_links for select using (public.is_opp_public(opportunity_id) or public.is_opp_editor(opportunity_id) or public.is_admin());
drop policy if exists "otaglinks: editor write" on public.opportunity_tag_links;
create policy "otaglinks: editor write" on public.opportunity_tag_links for all using (public.is_opp_editor(opportunity_id) or public.is_admin()) with check (public.is_opp_editor(opportunity_id) or public.is_admin());

-- ---------- OPPORTUNITIES read/write ----------
drop policy if exists "opps: read published" on public.opportunities;
drop policy if exists "opps: read network" on public.opportunities;
drop policy if exists "opps: read network" on public.opportunities;
create policy "opps: read network" on public.opportunities
  for select using (
    (deleted_at is null and business_status = 'active' and moderation = 'approved'
      and published_at is not null and published_at <= now()
      and (expiration_date is null or expiration_date >= current_date)
      and public.is_org_public(org_id))
    or public.is_admin() or public.is_org_editor(org_id)
    or (org_id is not null and public.is_org_member(org_id))
  );
drop policy if exists "opps: author write" on public.opportunities;
drop policy if exists "opps: org editor write" on public.opportunities;
create policy "opps: org editor write" on public.opportunities
  for all using (public.is_org_editor(org_id) or public.has_admin_role('moderator'))
  with check (public.is_org_editor(org_id) or public.has_admin_role('moderator'));

-- ---------- APPLICATIONS ----------
drop policy if exists "apps: applicant or opp author" on public.applications;
drop policy if exists "apps: applicant/org/admin read" on public.applications;
create policy "apps: applicant/org/admin read" on public.applications
  for select using (user_id = auth.uid() or public.is_admin() or public.is_opp_manager(opp_id));
drop policy if exists "apps: applicant insert" on public.applications;
drop policy if exists "apps: applicant insert" on public.applications;
create policy "apps: applicant insert" on public.applications
  for insert with check (user_id = auth.uid());
drop policy if exists "apps: applicant/author update" on public.applications;
-- прямий update заборонено: статус/withdraw лише через RPC (definer). Лишаємо
-- вузьку політику для applicant на власні НЕсистемні поля — блокує тригер (024).
drop policy if exists "apps: applicant own update" on public.applications;
create policy "apps: applicant own update" on public.applications
  for update using (user_id = auth.uid() or public.is_admin());

-- ---------- status history / internal notes ----------
drop policy if exists "ash: read" on public.application_status_history;
drop policy if exists "ash: read" on public.application_status_history;
create policy "ash: read" on public.application_status_history
  for select using (public.is_admin() or public.is_opp_manager((select opp_id from public.applications a where a.id = application_id))
    or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()));

drop policy if exists "ain: read" on public.application_internal_notes;
drop policy if exists "ain: read" on public.application_internal_notes;
create policy "ain: read" on public.application_internal_notes
  for select using (public.is_admin() or public.is_org_manager(organization_id));
drop policy if exists "ain: editor write" on public.application_internal_notes;
drop policy if exists "ain: editor write" on public.application_internal_notes;
create policy "ain: editor write" on public.application_internal_notes
  for all using (public.is_org_manager(organization_id) or public.is_admin())
  with check (public.is_org_manager(organization_id) or public.is_admin());

-- ============================================================
-- PUBLIC VIEW (без прихованого бюджету/внутрішніх полів)
-- ============================================================
drop view if exists public.public_opportunities;
create view public.public_opportunities as
  select
    o.id, o.slug, o.title, o.short_desc, o.full_desc,
    o.opportunity_type_id, t.slug as type_slug, t.title_uk as type_title,
    o.org_id, org.name as org_name, org.slug as org_slug, org.logo as org_logo, (org.verification='verified') as org_verified,
    o.sports, o.professional_categories, o.country, o.region, o.city, o.remote_mode, o.expected_format, o.tags,
    o.budget_vis,
    case when o.budget_vis = 'public' then o.budget_from end as budget_from,
    case when o.budget_vis = 'public' then o.budget_to   end as budget_to,
    case when o.budget_vis = 'public' then o.currency    end as currency,
    o.application_method, o.external_application_url,
    o.application_deadline, o.expiration_date, o.featured, o.applications_count, o.views_count,
    o.published_at, o.created_at, o.updated_at
  from public.opportunities o
  join public.organizations org on org.id = o.org_id and org.deleted_at is null and org.moderation = 'approved'
  left join public.opportunity_types t on t.id = o.opportunity_type_id
  where o.deleted_at is null and o.business_status = 'active' and o.moderation = 'approved'
    and o.published_at is not null and o.published_at <= now()
    and (o.expiration_date is null or o.expiration_date >= current_date);
grant select on public.public_opportunities to anon, authenticated;

-- ============================================================
-- ТРИГЕР-БАРʼЄР opportunities (заміна 014): системні поля лише через RPC (флаг)
-- ============================================================
create or replace function public.guard_opps_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv or public.has_admin_role('moderator') then return new; end if;
  if tg_op = 'INSERT' then
    new.business_status := 'draft'; new.moderation := 'not_submitted';
    new.verified := false; new.featured := false; new.admin_notes := null; new.deleted_at := null;
    new.published_at := null; new.paused_at := null; new.closed_at := null; new.expired_at := null; new.archived_at := null;
    new.moderation_reason := null; new.applications_count := 0; new.views_count := 0; new.version := 1;
    new.created_by := auth.uid();
  else
    new.business_status := old.business_status; new.moderation := old.moderation;
    new.verified := old.verified; new.featured := old.featured; new.admin_notes := old.admin_notes;
    new.deleted_at := old.deleted_at; new.published_at := old.published_at;
    new.paused_at := old.paused_at; new.closed_at := old.closed_at; new.expired_at := old.expired_at; new.archived_at := old.archived_at;
    new.moderation_reason := old.moderation_reason; new.applications_count := old.applications_count;
    new.views_count := old.views_count; new.created_by := old.created_by; new.slug := old.slug;
    new.org_id := old.org_id; new.version := old.version + 1;
  end if;
  return new;
end $$;
drop trigger if exists t_opps_guard on public.opportunities;
create trigger t_opps_guard before insert or update on public.opportunities
  for each row execute function public.guard_opps_write();

-- applications: заборонити зміну статусу/системних полів прямим update
create or replace function public.guard_apps_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv or public.has_admin_role('moderator') then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'new'; new.viewed_at := null; new.withdrawn_at := null; new.version := 1;
  else
    new.status := old.status; new.viewed_at := old.viewed_at; new.withdrawn_at := old.withdrawn_at;
    new.user_id := old.user_id; new.opp_id := old.opp_id; new.version := old.version + 1;
  end if;
  return new;
end $$;
drop trigger if exists t_apps_guard on public.applications;
create trigger t_apps_guard before insert or update on public.applications
  for each row execute function public.guard_apps_write();

do $$ begin
  create trigger t_opps_m4_touch before update on public.opportunities for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_ain_touch before update on public.application_internal_notes for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
