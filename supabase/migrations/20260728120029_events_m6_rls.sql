-- ============================================================
-- 029 · Milestone 6 — Events: RLS, helpers, trigger-barʼєр, public view
-- Публічно видно лише approved + published/postponed/completed + not deleted.
-- Приватні online-лінки, контакти учасників, internal notes — поза public API.
-- ============================================================

alter table public.event_types                       enable row level security;
alter table public.event_speakers                    enable row level security;
alter table public.event_partners                    enable row level security;
alter table public.event_tags                        enable row level security;
alter table public.event_tag_links                   enable row level security;
alter table public.event_schedule_items              enable row level security;
alter table public.event_registration_status_history enable row level security;
alter table public.event_attendance                  enable row level security;
alter table public.event_internal_notes              enable row level security;
alter table public.event_reminders                   enable row level security;
alter table public.event_messages                    enable row level security;
alter table public.event_reschedule_history          enable row level security;

-- ---------- helpers ----------
create or replace function public.event_org(p_event uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.events where id = p_event;
$$;
create or replace function public.is_event_manager(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_manager(public.event_org(p_event));
$$;
create or replace function public.is_event_editor(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_editor(public.event_org(p_event));
$$;
-- публічно доступна подія (approved + published/postponed/completed)
create or replace function public.is_event_public(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event and e.deleted_at is null
      and e.moderation = 'approved'
      and e.business_status in ('published','postponed','completed'));
$$;
-- чи є користувач учасником події (для приватного online-лінку/списку)
create or replace function public.is_event_participant(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_registrations r
    where r.event_id = p_event and r.user_id = auth.uid()
      and r.status in ('registered','attended'));
$$;
revoke all on function public.event_org(uuid), public.is_event_manager(uuid), public.is_event_editor(uuid), public.is_event_public(uuid), public.is_event_participant(uuid) from public;
grant execute on function public.event_org(uuid), public.is_event_manager(uuid), public.is_event_editor(uuid), public.is_event_public(uuid), public.is_event_participant(uuid) to anon, authenticated, service_role;

-- ---------- event_types ----------
drop policy if exists "etypes: read" on public.event_types;
create policy "etypes: read" on public.event_types for select using (true);
drop policy if exists "etypes: admin write" on public.event_types;
create policy "etypes: admin write" on public.event_types for all using (public.is_admin()) with check (public.is_admin());

-- ---------- event_tags ----------
drop policy if exists "etags: read" on public.event_tags;
create policy "etags: read" on public.event_tags for select using (true);
drop policy if exists "etags: auth write" on public.event_tags;
create policy "etags: auth write" on public.event_tags for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "etaglinks: read" on public.event_tag_links;
create policy "etaglinks: read" on public.event_tag_links for select using (public.is_event_public(event_id) or public.is_event_editor(event_id) or public.has_admin_role('event_manager'));
drop policy if exists "etaglinks: editor write" on public.event_tag_links;
create policy "etaglinks: editor write" on public.event_tag_links for all using (public.is_event_editor(event_id) or public.has_admin_role('event_manager')) with check (public.is_event_editor(event_id) or public.has_admin_role('event_manager'));

-- ---------- EVENTS read/write ----------
drop policy if exists "events: read published" on public.events;
drop policy if exists "events: read network" on public.events;
create policy "events: read network" on public.events
  for select using (
    (deleted_at is null and moderation = 'approved' and business_status in ('published','postponed','completed'))
    or public.has_admin_role('event_manager') or public.is_admin()
    or public.is_org_editor(org_id)
    or (org_id is not null and public.is_org_member(org_id))
  );
drop policy if exists "events: admin/em write" on public.events;
drop policy if exists "events: org editor write" on public.events;
create policy "events: org editor write" on public.events
  for all using (public.is_org_editor(org_id) or public.has_admin_role('event_manager'))
  with check (public.is_org_editor(org_id) or public.has_admin_role('event_manager'));

-- ---------- speakers / partners / schedule (read public|editor|EM; write editor|EM) ----------
drop policy if exists "espk: read" on public.event_speakers;
create policy "espk: read" on public.event_speakers for select using (public.is_event_public(event_id) or public.is_event_editor(event_id) or public.has_admin_role('event_manager'));
drop policy if exists "espk: write" on public.event_speakers;
create policy "espk: write" on public.event_speakers for all using (public.is_event_editor(event_id) or public.has_admin_role('event_manager')) with check (public.is_event_editor(event_id) or public.has_admin_role('event_manager'));

drop policy if exists "eprt: read" on public.event_partners;
create policy "eprt: read" on public.event_partners for select using (public.is_event_public(event_id) or public.is_event_editor(event_id) or public.has_admin_role('event_manager'));
drop policy if exists "eprt: write" on public.event_partners;
create policy "eprt: write" on public.event_partners for all using (public.is_event_editor(event_id) or public.has_admin_role('event_manager')) with check (public.is_event_editor(event_id) or public.has_admin_role('event_manager'));

drop policy if exists "esch: read" on public.event_schedule_items;
create policy "esch: read" on public.event_schedule_items for select using ((public.is_event_public(event_id) and deleted_at is null) or public.is_event_editor(event_id) or public.has_admin_role('event_manager'));
drop policy if exists "esch: write" on public.event_schedule_items;
create policy "esch: write" on public.event_schedule_items for all using (public.is_event_editor(event_id) or public.has_admin_role('event_manager')) with check (public.is_event_editor(event_id) or public.has_admin_role('event_manager'));

-- ---------- registrations (read own | org manager | EM). Запис лише через RPC. ----------
drop policy if exists "regs: own/admin" on public.event_registrations;
drop policy if exists "eregs: read" on public.event_registrations;
create policy "eregs: read" on public.event_registrations
  for select using (user_id = auth.uid() or public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());
-- прямий update дозволено лише власнику НЕсистемних полів; системні поля тримає тригер.
drop policy if exists "eregs: owner update" on public.event_registrations;
create policy "eregs: owner update" on public.event_registrations
  for update using (user_id = auth.uid() or public.is_admin());

-- ---------- status history / attendance ----------
drop policy if exists "ersh: read" on public.event_registration_status_history;
create policy "ersh: read" on public.event_registration_status_history
  for select using (public.has_admin_role('event_manager') or public.is_admin()
    or exists (select 1 from public.event_registrations r where r.id = registration_id and (r.user_id = auth.uid() or public.is_event_manager(r.event_id))));

drop policy if exists "eatt: read" on public.event_attendance;
create policy "eatt: read" on public.event_attendance
  for select using (user_id = auth.uid() or public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());

-- ---------- internal notes / reminders / messages / reschedule (EM + org manager) ----------
drop policy if exists "enotes: rw" on public.event_internal_notes;
create policy "enotes: rw" on public.event_internal_notes
  for all using (public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin())
  with check (public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());
drop policy if exists "erem: read" on public.event_reminders;
create policy "erem: read" on public.event_reminders
  for select using (public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());
drop policy if exists "emsg: read" on public.event_messages;
create policy "emsg: read" on public.event_messages
  for select using (public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());
drop policy if exists "ersch: read" on public.event_reschedule_history;
create policy "ersch: read" on public.event_reschedule_history
  for select using (public.is_event_public(event_id) or public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.is_admin());

-- ============================================================
-- PUBLIC VIEW (feed): без приватного online-лінку/контактів/internal
-- ============================================================
drop view if exists public.public_events;
create view public.public_events as
  select
    e.id, e.slug, e.title, e.short_desc, e.cover, e.cover_media_id,
    e.event_type_id, t.slug as type_slug, t.title_uk as type_title,
    e.format_kind, e.org_id, org.name as org_name, org.slug as org_slug, org.logo as org_logo, (org.verification='verified') as org_verified,
    e.country, e.region, e.city, e.venue_name,
    e.online_platform, e.online_public_url,
    e.timezone, e.starts_at, e.ends_at, e.registration_opens_at, e.registration_deadline_at,
    e.capacity, e.registered_count, e.waitlist_count, e.waitlist_enabled,
    e.ticket_type, e.ticket_price, e.currency, e.external_ticket_url,
    e.registration_mode, e.participant_list_vis, e.business_status, e.featured, e.tags,
    e.published_at, e.postponed_at, e.public_cancel_reason, e.created_at, e.updated_at
  from public.events e
  join public.organizations org on org.id = e.org_id and org.deleted_at is null and org.moderation = 'approved'
  left join public.event_types t on t.id = e.event_type_id
  where e.deleted_at is null and e.moderation = 'approved'
    and e.business_status in ('published','postponed','completed');
grant select on public.public_events to anon, authenticated;

-- ============================================================
-- ТРИГЕР-БАРʼЄР events: системні поля лише через RPC (privileged flag) або EM
-- ============================================================
create or replace function public.guard_events_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv or public.has_admin_role('event_manager') then return new; end if;
  if tg_op = 'INSERT' then
    new.business_status := 'draft'; new.moderation := 'not_submitted'; new.status := 'draft'::moderation_status;
    new.featured := false; new.admin_notes := null; new.deleted_at := null;
    new.published_at := null; new.scheduled_publish_at := null; new.cancelled_at := null;
    new.postponed_at := null; new.completed_at := null; new.archived_at := null;
    new.moderation_reason := null; new.public_cancel_reason := null; new.internal_cancel_note := null;
    new.registered_count := 0; new.waitlist_count := 0; new.version := 1;
    new.created_by := auth.uid();
  else
    new.business_status := old.business_status; new.moderation := old.moderation; new.status := old.status;
    new.featured := old.featured; new.admin_notes := old.admin_notes; new.deleted_at := old.deleted_at;
    new.published_at := old.published_at; new.scheduled_publish_at := old.scheduled_publish_at;
    new.cancelled_at := old.cancelled_at; new.postponed_at := old.postponed_at;
    new.completed_at := old.completed_at; new.archived_at := old.archived_at;
    new.moderation_reason := old.moderation_reason; new.public_cancel_reason := old.public_cancel_reason;
    new.internal_cancel_note := old.internal_cancel_note;
    new.registered_count := old.registered_count; new.waitlist_count := old.waitlist_count;
    new.created_by := old.created_by; new.slug := old.slug; new.org_id := old.org_id;
    new.online_private_url := old.online_private_url;   -- приватний лінк лише через RPC
    new.version := old.version + 1;
  end if;
  return new;
end $$;
drop trigger if exists t_events_guard on public.events;
create trigger t_events_guard before insert or update on public.events
  for each row execute function public.guard_events_write();

-- registrations: системні поля/статуси лише через RPC
create or replace function public.guard_event_regs_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv or public.has_admin_role('event_manager') then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.version := 1;
    new.approved_at := null; new.rejected_at := null; new.cancelled_at := null; new.waitlisted_at := null;
    new.promoted_at := null; new.checked_in_at := null; new.checked_in_by := null; new.check_in_token := null;
    new.promotion_status := 'not_offered'; new.promotion_offered_at := null; new.promotion_expires_at := null;
    new.waitlist_seq := null;
  else
    new.status := old.status; new.user_id := old.user_id; new.event_id := old.event_id;
    new.approved_at := old.approved_at; new.rejected_at := old.rejected_at; new.cancelled_at := old.cancelled_at;
    new.waitlisted_at := old.waitlisted_at; new.promoted_at := old.promoted_at;
    new.checked_in_at := old.checked_in_at; new.checked_in_by := old.checked_in_by; new.check_in_token := old.check_in_token;
    new.promotion_status := old.promotion_status; new.promotion_offered_at := old.promotion_offered_at;
    new.promotion_expires_at := old.promotion_expires_at; new.waitlist_seq := old.waitlist_seq;
    new.version := old.version + 1;
  end if;
  return new;
end $$;
drop trigger if exists t_event_regs_guard on public.event_registrations;
create trigger t_event_regs_guard before insert or update on public.event_registrations
  for each row execute function public.guard_event_regs_write();
