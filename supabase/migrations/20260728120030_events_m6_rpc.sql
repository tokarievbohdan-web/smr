-- ============================================================
-- 030 · Milestone 6 — Events: атомарні RPC
-- SECURITY DEFINER + fixed search_path + role/ownership + audit + notify.
-- Вместимость рахуємо під row-lock події (FOR UPDATE) → без overbooking.
-- Waitlist — offer-based: звільнене місце «тримається» офером до підтвердження.
-- ============================================================

-- analytics helper (единый вход для подій аналітики з RPC)
create or replace function public._net_analytics(p_uid uuid, p_event text, p_props jsonb default '{}'::jsonb)
returns void language sql set search_path = public as $$
  insert into public.analytics_events(user_id, event, props) values (p_uid, p_event, coalesce(p_props,'{}'::jsonb));
$$;

-- feedback (легка таблиця; RLS нижче)
create table if not exists public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  attended boolean, useful boolean, made_connections boolean, wants_similar boolean,
  comment text, created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.event_feedback enable row level security;
drop policy if exists "efb: own insert" on public.event_feedback;
create policy "efb: own insert" on public.event_feedback for insert with check (user_id = auth.uid());
drop policy if exists "efb: read agg" on public.event_feedback;
create policy "efb: read agg" on public.event_feedback
  for select using (user_id = auth.uid() or public.is_event_manager(event_id) or public.has_admin_role('event_manager') or public.has_admin_role('analyst') or public.is_admin());

-- ---------- slug ----------
create or replace function public._unique_event_slug(p_base text, p_event uuid)
returns text language plpgsql set search_path = public as $$
declare s text := coalesce(public.slugify(p_base),'event'); c text := s; i int := 2;
begin
  while exists (select 1 from public.events where slug=c and deleted_at is null and (p_event is null or id<>p_event)) loop
    c := s||'-'||i; i := i+1; end loop;
  return c;
end $$;

-- ---------- occupancy (під lock події) ----------
create or replace function public._event_occupied(p_event uuid)
returns int language sql stable security definer set search_path = public as $$
  select (select count(*) from public.event_registrations r
          where r.event_id = p_event and r.status = 'registered')
       + (select count(*) from public.event_registrations r
          where r.event_id = p_event and r.status = 'waitlisted' and r.promotion_status = 'offered');
$$;

-- пересчёт денорм-лічильників
create or replace function public._event_recount(p_event uuid)
returns void language sql security definer set search_path = public as $$
  update public.events set
    registered_count = (select count(*) from public.event_registrations where event_id=p_event and status='registered'),
    waitlist_count   = (select count(*) from public.event_registrations where event_id=p_event and status='waitlisted')
  where id = p_event;
$$;

-- ---------- validation ----------
create or replace function public._event_validate(e public.events) returns void language plpgsql set search_path = public as $$
begin
  if coalesce(trim(e.title),'')='' then raise exception 'validation: назва обовʼязкова' using errcode='P0001'; end if;
  if e.event_type_id is null then raise exception 'validation: тип події' using errcode='P0001'; end if;
  if coalesce(trim(e.timezone),'')='' then raise exception 'validation: таймзона' using errcode='P0001'; end if;
  if e.starts_at is null then raise exception 'validation: дата початку' using errcode='P0001'; end if;
  if e.ends_at is not null and e.ends_at < e.starts_at then raise exception 'validation: кінець раніше за початок' using errcode='P0001'; end if;
  if e.registration_deadline_at is not null and e.registration_deadline_at > e.starts_at then raise exception 'validation: дедлайн реєстрації після початку' using errcode='P0001'; end if;
  if e.capacity is not null and e.capacity < 0 then raise exception 'validation: capacity<0' using errcode='P0001'; end if;
  if e.format_kind = 'offline' then
    if coalesce(trim(e.country),'')='' or coalesce(trim(e.city),'')='' or (coalesce(trim(e.venue_name),'')='' and coalesce(trim(e.address),'')='') then
      raise exception 'validation: для офлайн потрібні країна, місто та майданчик/адреса' using errcode='P0001'; end if;
  elsif e.format_kind = 'online' then
    if coalesce(trim(e.online_platform),'')='' and coalesce(trim(e.online_public_url),'')='' and coalesce(trim(e.online_private_url),'')='' then
      raise exception 'validation: для онлайн потрібна платформа або посилання' using errcode='P0001'; end if;
  elsif e.format_kind = 'hybrid' then
    if coalesce(trim(e.city),'')='' or (coalesce(trim(e.online_platform),'')='' and coalesce(trim(e.online_public_url),'')='' and coalesce(trim(e.online_private_url),'')='') then
      raise exception 'validation: для гібриду потрібні фізична локація та онлайн-доступ' using errcode='P0001'; end if;
  end if;
  if e.ticket_type = 'paid_external' and coalesce(trim(e.external_ticket_url),'')='' then
    raise exception 'validation: платна подія потребує зовнішнього посилання на квитки' using errcode='P0001'; end if;
end $$;

-- ============================================================
-- CREATE / UPDATE draft
-- ============================================================
create or replace function public.create_event_draft(p_org uuid, p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_slug text; v_title text;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if not (public.is_org_editor(p_org) or public.has_admin_role('event_manager')) then raise exception 'forbidden: org role required' using errcode='42501'; end if;
  if not public.is_org_public(p_org) and not public.has_admin_role('event_manager') then raise exception 'validation: організація не схвалена' using errcode='P0001'; end if;
  v_title := coalesce(p_patch->>'title','Нова подія');
  v_id := gen_random_uuid(); v_slug := public._unique_event_slug(v_title, v_id);
  perform set_config('app.privileged_write','1',true);
  insert into public.events(id, slug, title, org_id, created_by, business_status, moderation, status, timezone)
    values (v_id, v_slug, v_title, p_org, v_actor, 'draft', 'not_submitted', 'draft'::moderation_status, coalesce(p_patch->>'timezone','Europe/Kyiv'));
  perform public._net_audit(v_actor,'event_draft_created','event',v_id::text,null,jsonb_build_object('slug',v_slug),p_request_id);
  perform public._net_analytics(v_actor,'event_created',jsonb_build_object('event',v_id));
  return jsonb_build_object('ok',true,'id',v_id,'slug',v_slug);
end $$;

create or replace function public.update_event_draft(p_id uuid, p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_ver int; v_bs event_business_status; v_mod event_moderation_status;
begin
  if not (public.is_event_editor(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  select version, business_status, moderation into v_ver, v_bs, v_mod from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_expected_version is not null and p_expected_version <> v_ver then raise exception 'version_conflict' using errcode='40001'; end if;
  if v_bs <> 'draft' and not public.has_admin_role('event_manager') then
    raise exception 'invalid_status_transition: редагувати можна лише draft' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set
    title=coalesce(p_patch->>'title',title), short_desc=coalesce(p_patch->>'short_desc',short_desc), full_desc=coalesce(p_patch->>'full_desc',full_desc),
    event_type_id=coalesce(nullif(p_patch->>'event_type_id','')::uuid,event_type_id),
    format_kind=coalesce((p_patch->>'format_kind')::event_format,format_kind),
    primary_contact_user_id=coalesce(nullif(p_patch->>'primary_contact_user_id','')::uuid,primary_contact_user_id),
    cover_media_id=coalesce(nullif(p_patch->>'cover_media_id','')::uuid,cover_media_id), cover=coalesce(p_patch->>'cover',cover),
    country=coalesce(p_patch->>'country',country), region=coalesce(p_patch->>'region',region), city=coalesce(p_patch->>'city',city),
    venue_name=coalesce(p_patch->>'venue_name',venue_name), address=coalesce(p_patch->>'address',address), map_url=coalesce(p_patch->>'map_url',map_url),
    online_platform=coalesce(p_patch->>'online_platform',online_platform), online_public_url=coalesce(p_patch->>'online_public_url',online_public_url),
    timezone=coalesce(p_patch->>'timezone',timezone),
    starts_at=coalesce((p_patch->>'starts_at')::timestamptz,starts_at), ends_at=coalesce((p_patch->>'ends_at')::timestamptz,ends_at),
    registration_opens_at=coalesce((p_patch->>'registration_opens_at')::timestamptz,registration_opens_at),
    registration_deadline_at=coalesce((p_patch->>'registration_deadline_at')::timestamptz,registration_deadline_at),
    capacity=coalesce((p_patch->>'capacity')::int,capacity),
    waitlist_enabled=coalesce((p_patch->>'waitlist_enabled')::boolean,waitlist_enabled),
    participant_list_vis=coalesce((p_patch->>'participant_list_vis')::participant_list_visibility,participant_list_vis),
    ticket_type=coalesce((p_patch->>'ticket_type')::event_ticket_type,ticket_type),
    ticket_price=coalesce((p_patch->>'ticket_price')::numeric,ticket_price), currency=coalesce(p_patch->>'currency',currency),
    external_ticket_url=coalesce(p_patch->>'external_ticket_url',external_ticket_url),
    registration_mode=coalesce((p_patch->>'registration_mode')::event_registration_mode,registration_mode),
    approval_required=coalesce((p_patch->>'approval_required')::boolean,approval_required),
    tags=coalesce(public._jarr(p_patch,'tags'),tags), content_version=content_version+1, updated_at=now()
  where id=p_id;
  perform public._net_audit(v_actor,'event_updated','event',p_id::text,jsonb_build_object('version',v_ver),jsonb_build_object('version',v_ver+1),p_request_id);
  return jsonb_build_object('ok',true,'id',p_id,'version',v_ver+1);
end $$;

-- ============================================================
-- SUBMIT / moderation
-- ============================================================
create or replace function public.submit_event_for_moderation(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not (public.is_event_editor(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.moderation not in ('not_submitted','changes_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform public._event_validate(e);
  perform set_config('app.privileged_write','1',true);
  update public.events set moderation='pending' where id=p_id;
  perform public._net_audit(v_actor,'event_submitted','event',p_id::text,null,jsonb_build_object('moderation','pending'),p_request_id);
  perform public._net_analytics(v_actor,'event_submitted',jsonb_build_object('event',p_id));
  return jsonb_build_object('ok',true,'moderation','pending');
end $$;

-- approveAndPublishEvent: атомарно approve (+ optional publish зараз/за розкладом)
create or replace function public.admin_approve_event(p_id uuid, p_publish boolean default true, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events; v_slug text; v_bs event_business_status; v_pub timestamptz;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.moderation not in ('pending','changes_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if not public.is_org_public(e.org_id) then raise exception 'validation: організація не схвалена' using errcode='P0001'; end if;
  perform public._event_validate(e);
  v_slug := coalesce(e.slug, public._unique_event_slug(e.title, p_id));
  if p_publish and (e.scheduled_publish_at is null or e.scheduled_publish_at <= now()) then
    v_bs := 'published'; v_pub := now();
  elsif e.scheduled_publish_at is not null then
    v_bs := 'scheduled'; v_pub := null;
  else
    v_bs := 'draft'; v_pub := null;
  end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set moderation='approved', business_status=v_bs, slug=v_slug,
    status='published'::moderation_status, published_at=coalesce(published_at, v_pub), moderation_reason=null where id=p_id;
  perform public._net_audit(v_actor,'event_approved','event',p_id::text,jsonb_build_object('moderation',e.moderation),jsonb_build_object('moderation','approved','business',v_bs),p_request_id);
  perform public._net_notify(e.created_by,'event_approved','Подію схвалено', case when v_bs='published' then 'Опубліковано' else 'Готово до публікації' end,'event',p_id::text);
  perform public._net_analytics(v_actor,'event_approved',jsonb_build_object('event',p_id,'business',v_bs));
  return jsonb_build_object('ok',true,'slug',v_slug,'business_status',v_bs);
end $$;

create or replace function public.admin_request_event_changes(p_id uuid, p_reason text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_by uuid;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select created_by into v_by from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set moderation='changes_required', moderation_reason=p_reason where id=p_id;
  perform public._net_audit(v_actor,'event_changes_requested','event',p_id::text,null,jsonb_build_object('reason',p_reason),p_request_id);
  perform public._net_notify(v_by,'event_changes_required','Потрібні зміни у події',p_reason,'event',p_id::text);
  return jsonb_build_object('ok',true,'moderation','changes_required');
end $$;

create or replace function public.admin_reject_event(p_id uuid, p_reason text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_by uuid;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select created_by into v_by from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set moderation='rejected', business_status='draft', moderation_reason=p_reason where id=p_id;
  perform public._net_audit(v_actor,'event_rejected','event',p_id::text,null,jsonb_build_object('reason',p_reason),p_request_id);
  perform public._net_notify(v_by,'event_rejected','Подію відхилено',p_reason,'event',p_id::text);
  return jsonb_build_object('ok',true,'moderation','rejected');
end $$;

create or replace function public.schedule_event_publication(p_id uuid, p_when timestamptz, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  if p_when is null or p_when <= now() then raise exception 'validation: дата у минулому' using errcode='P0001'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.moderation <> 'approved' then raise exception 'invalid_status_transition: спершу схвалення' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set scheduled_publish_at=p_when, business_status='scheduled' where id=p_id;
  perform public._net_audit(v_actor,'event_scheduled','event',p_id::text,null,jsonb_build_object('when',p_when),p_request_id);
  return jsonb_build_object('ok',true,'business_status','scheduled','scheduled_publish_at',p_when);
end $$;

create or replace function public.publish_event(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.moderation <> 'approved' or e.business_status not in ('draft','scheduled') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set business_status='published', status='published'::moderation_status, published_at=coalesce(published_at,now()) where id=p_id;
  perform public._net_audit(v_actor,'event_published','event',p_id::text,null,jsonb_build_object('business','published'),p_request_id);
  perform public._net_notify(e.created_by,'event_published','Подію опубліковано','','event',p_id::text);
  return jsonb_build_object('ok',true,'business_status','published');
end $$;

-- ============================================================
-- REGISTRATION
-- ============================================================
create or replace function public.register_for_event(p_event uuid, p_answers jsonb default null, p_share_profile boolean default false, p_share_list boolean default false, p_source text default 'web', p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events; v_occ int; v_status event_reg_status; v_id uuid; v_existing public.event_registrations; v_has boolean;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_event and deleted_at is null for update;   -- serialize per-event
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.business_status <> 'published' or e.moderation <> 'approved' then raise exception 'validation: реєстрація недоступна' using errcode='P0001'; end if;
  if e.registration_mode = 'disabled' then raise exception 'validation: реєстрацію вимкнено' using errcode='P0001'; end if;
  if e.registration_mode = 'external' then raise exception 'validation: реєстрація на зовнішньому сайті' using errcode='P0001'; end if;
  if e.registration_opens_at is not null and e.registration_opens_at > now() then raise exception 'validation: реєстрацію ще не відкрито' using errcode='P0001'; end if;
  if e.registration_deadline_at is not null and e.registration_deadline_at < now() then raise exception 'validation: реєстрацію закрито' using errcode='P0001'; end if;

  select * into v_existing from public.event_registrations where event_id=p_event and user_id=v_actor for update;
  v_has := found;   -- NB: подальший perform set_config скидає FOUND, тож фіксуємо існування тут
  if v_has and v_existing.status in ('pending','registered','waitlisted','invited') then
    raise exception 'duplicate registration' using errcode='23505'; end if;

  v_occ := public._event_occupied(p_event);
  if e.registration_mode = 'approval_required' or e.approval_required then
    v_status := 'pending';
  elsif e.capacity is null or v_occ < e.capacity then
    v_status := 'registered';
  elsif e.waitlist_enabled then
    v_status := 'waitlisted';
  else
    raise exception 'capacity_full' using errcode='P0001';
  end if;

  perform set_config('app.privileged_write','1',true);
  if v_has then   -- реактивуємо скасовану/відхилену реєстрацію
    update public.event_registrations set status=v_status, registration_source=p_source, answers=coalesce(p_answers,answers),
      consent_to_share_profile=p_share_profile, consent_to_participant_list=p_share_list,
      registered_at=now(), cancelled_at=null, rejected_at=null,
      waitlisted_at=case when v_status='waitlisted' then now() else null end,
      waitlist_seq=case when v_status='waitlisted' then nextval('public.event_waitlist_seq') else null end,
      promotion_status='not_offered', promotion_offered_at=null, promotion_expires_at=null
      where id=v_existing.id returning id into v_id;
  else
    insert into public.event_registrations(event_id,user_id,status,registration_source,answers,consent_to_share_profile,consent_to_participant_list,registered_at,waitlisted_at,waitlist_seq)
      values (p_event,v_actor,v_status,p_source,p_answers,p_share_profile,p_share_list,now(),
        case when v_status='waitlisted' then now() else null end,
        case when v_status='waitlisted' then nextval('public.event_waitlist_seq') else null end)
      returning id into v_id;
  end if;
  insert into public.event_registration_status_history(registration_id,from_status,to_status,changed_by) values (v_id,null,v_status,v_actor);
  perform public._event_recount(p_event);
  perform public._net_notify(v_actor, 'event_registration_'||v_status::text,
    case v_status when 'registered' then 'Реєстрацію підтверджено' when 'waitlisted' then 'Ви у списку очікування' else 'Заявку надіслано' end, '', 'event', p_event::text);
  if v_status in ('pending') then perform public._net_notify(e.created_by,'event_registration_pending','Нова заявка на участь','','event',p_event::text); end if;
  if v_status in ('registered','waitlisted') then perform public._net_notify(e.created_by,'event_registration_new','Нова реєстрація','','event',p_event::text); end if;
  perform public._net_audit(v_actor,'event_registration_created','event_registration',v_id::text,null,jsonb_build_object('status',v_status),p_request_id);
  perform public._net_analytics(v_actor, case when v_status='waitlisted' then 'event_waitlisted' else 'event_registered' end, jsonb_build_object('event',p_event));
  return jsonb_build_object('ok',true,'id',v_id,'status',v_status);
end $$;

create or replace function public.cancel_event_registration(p_event uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.event_registrations; e public.events;
begin
  select * into e from public.events where id=p_event for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  select * into r from public.event_registrations where event_id=p_event and user_id=v_actor for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if r.status not in ('pending','registered','waitlisted','invited') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.event_registrations set status='cancelled', cancelled_at=now(), promotion_status=case when promotion_status='offered' then 'declined' else promotion_status end where id=r.id;
  insert into public.event_registration_status_history(registration_id,from_status,to_status,changed_by) values (r.id,r.status,'cancelled',v_actor);
  perform public._event_recount(p_event);
  perform public._net_notify(e.created_by,'event_registration_cancelled','Скасовано реєстрацію','','event',p_event::text);
  perform public._net_audit(v_actor,'event_registration_cancelled','event_registration',r.id::text,jsonb_build_object('status',r.status),jsonb_build_object('status','cancelled'),p_request_id);
  perform public._net_analytics(v_actor,'registration_cancelled',jsonb_build_object('event',p_event));
  perform public.promote_next_waitlist_participant(p_event);
  return jsonb_build_object('ok',true,'status','cancelled');
end $$;

-- ---------- approval-required decisions (organizer/EM) ----------
create or replace function public._event_reg_decide(p_reg uuid, p_to event_reg_status, p_reason text, p_req text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.event_registrations; e public.events; v_occ int; v_final event_reg_status;
begin
  select * into r from public.event_registrations where id=p_reg for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  select * into e from public.events where id=r.event_id for update;
  if not (public.is_event_manager(r.event_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  if r.status not in ('pending','waitlisted') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  v_final := p_to;
  if p_to = 'registered' then
    v_occ := public._event_occupied(r.event_id);
    if e.capacity is not null and v_occ >= e.capacity then
      if e.waitlist_enabled then v_final := 'waitlisted'; else raise exception 'capacity_full' using errcode='P0001'; end if;
    end if;
  end if;
  perform set_config('app.privileged_write','1',true);
  update public.event_registrations set status=v_final,
    approved_at=case when v_final='registered' then now() else approved_at end,
    rejected_at=case when v_final='rejected' then now() else rejected_at end,
    waitlisted_at=case when v_final='waitlisted' then now() else waitlisted_at end,
    waitlist_seq=case when v_final='waitlisted' and waitlist_seq is null then nextval('public.event_waitlist_seq') else waitlist_seq end
    where id=p_reg;
  insert into public.event_registration_status_history(registration_id,from_status,to_status,changed_by,change_reason) values (p_reg,r.status,v_final,v_actor,p_reason);
  perform public._event_recount(r.event_id);
  perform public._net_notify(r.user_id,'event_registration_'||v_final::text,'Статус участі',coalesce(p_reason,''),'event',r.event_id::text);
  perform public._net_audit(v_actor,'event_registration_'||v_final::text,'event_registration',p_reg::text,jsonb_build_object('status',r.status),jsonb_build_object('status',v_final),p_req);
  return jsonb_build_object('ok',true,'status',v_final);
end $$;
create or replace function public.approve_event_registration(p_reg uuid, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._event_reg_decide(p_reg,'registered',null,p_request_id); $$;
create or replace function public.reject_event_registration(p_reg uuid, p_reason text default null, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._event_reg_decide(p_reg,'rejected',p_reason,p_request_id); $$;
create or replace function public.move_registration_to_waitlist(p_reg uuid, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._event_reg_decide(p_reg,'waitlisted',null,p_request_id); $$;

-- ---------- waitlist offer-flow ----------
create or replace function public.promote_next_waitlist_participant(p_event uuid, p_ttl_hours int default 48)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e public.events; v_occ int; r public.event_registrations;
begin
  select * into e from public.events where id=p_event for update;
  if not found then return jsonb_build_object('ok',true,'promoted',false); end if;
  if e.business_status <> 'published' or not e.waitlist_enabled then return jsonb_build_object('ok',true,'promoted',false); end if;
  v_occ := public._event_occupied(p_event);
  if e.capacity is not null and v_occ >= e.capacity then return jsonb_build_object('ok',true,'promoted',false); end if;
  select * into r from public.event_registrations
    where event_id=p_event and status='waitlisted' and promotion_status='not_offered'
    order by waitlist_seq asc limit 1 for update skip locked;
  if not found then return jsonb_build_object('ok',true,'promoted',false); end if;
  perform set_config('app.privileged_write','1',true);
  update public.event_registrations set promotion_status='offered', promotion_offered_at=now(), promotion_expires_at=now() + make_interval(hours => p_ttl_hours) where id=r.id;
  perform public._net_notify(r.user_id,'event_waitlist_offered','Звільнилось місце','Підтвердіть участь до завершення терміну','event',p_event::text);
  perform public._net_audit(null,'event_waitlist_offered','event_registration',r.id::text,null,jsonb_build_object('expires_h',p_ttl_hours),null);
  perform public._net_analytics(r.user_id,'waitlist_offer_sent',jsonb_build_object('event',p_event));
  return jsonb_build_object('ok',true,'promoted',true,'registration',r.id);
end $$;

create or replace function public.accept_waitlist_place(p_event uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.event_registrations;
begin
  perform 1 from public.events where id=p_event for update;
  select * into r from public.event_registrations where event_id=p_event and user_id=v_actor for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if r.status <> 'waitlisted' or r.promotion_status <> 'offered' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if r.promotion_expires_at is not null and r.promotion_expires_at < now() then raise exception 'validation: пропозицію протерміновано' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.event_registrations set status='registered', promotion_status='accepted', promoted_at=now(), registered_at=now() where id=r.id;
  insert into public.event_registration_status_history(registration_id,from_status,to_status,changed_by) values (r.id,'waitlisted','registered',v_actor);
  perform public._event_recount(p_event);
  perform public._net_notify(v_actor,'event_waitlist_confirmed','Місце підтверджено','','event',p_event::text);
  perform public._net_audit(v_actor,'event_waitlist_accepted','event_registration',r.id::text,null,jsonb_build_object('status','registered'),p_request_id);
  perform public._net_analytics(v_actor,'waitlist_offer_accepted',jsonb_build_object('event',p_event));
  return jsonb_build_object('ok',true,'status','registered');
end $$;

create or replace function public.decline_waitlist_place(p_event uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.event_registrations;
begin
  perform 1 from public.events where id=p_event for update;
  select * into r from public.event_registrations where event_id=p_event and user_id=v_actor for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if r.status <> 'waitlisted' or r.promotion_status <> 'offered' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.event_registrations set status='cancelled', promotion_status='declined', cancelled_at=now() where id=r.id;
  insert into public.event_registration_status_history(registration_id,from_status,to_status,changed_by) values (r.id,'waitlisted','cancelled',v_actor);
  perform public._event_recount(p_event);
  perform public.promote_next_waitlist_participant(p_event);
  return jsonb_build_object('ok',true,'status','declined');
end $$;

-- expire (cron): протерміновані офери → звільняють місце, пропонуємо наступному
create or replace function public.expire_waitlist_offers()
returns jsonb language plpgsql security definer set search_path = public as $$
declare cnt int := 0; rec record;
begin
  perform set_config('app.privileged_write','1',true);
  for rec in select id, event_id from public.event_registrations where promotion_status='offered' and promotion_expires_at is not null and promotion_expires_at < now() for update loop
    update public.event_registrations set promotion_status='expired' where id=rec.id;
    insert into public.event_registration_status_history(registration_id,from_status,to_status) values (rec.id,'waitlisted','waitlisted');
    perform public.promote_next_waitlist_participant(rec.event_id);
    cnt := cnt + 1;
  end loop;
  return jsonb_build_object('ok',true,'expired',cnt);
end $$;

-- ============================================================
-- LIFECYCLE: reschedule / cancel / complete / archive
-- ============================================================
create or replace function public.reschedule_event(p_id uuid, p_starts timestamptz, p_ends timestamptz default null, p_reason text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not (public.is_event_manager(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.business_status not in ('published','postponed','scheduled') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if p_starts is null then raise exception 'validation: нова дата' using errcode='P0001'; end if;
  if p_ends is not null and p_ends < p_starts then raise exception 'validation: кінець раніше за початок' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  insert into public.event_reschedule_history(event_id,old_starts_at,old_ends_at,new_starts_at,new_ends_at,changed_by,reason)
    values (p_id,e.starts_at,e.ends_at,p_starts,coalesce(p_ends,e.ends_at),v_actor,p_reason);
  update public.events set starts_at=p_starts, ends_at=coalesce(p_ends,ends_at), business_status='postponed', postponed_at=now() where id=p_id;
  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
    select distinct user_id,'event_rescheduled','Подію перенесено',coalesce(p_reason,''),'event',p_id::text
    from public.event_registrations where event_id=p_id and status in ('pending','registered','waitlisted');
  perform public._net_audit(v_actor,'event_rescheduled','event',p_id::text,jsonb_build_object('starts',e.starts_at),jsonb_build_object('starts',p_starts),p_request_id);
  perform public._net_analytics(v_actor,'event_rescheduled',jsonb_build_object('event',p_id));
  return jsonb_build_object('ok',true,'business_status','postponed','starts_at',p_starts);
end $$;

create or replace function public.cancel_event(p_id uuid, p_public_reason text, p_internal_note text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not (public.is_event_manager(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_public_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.business_status in ('cancelled','archived','completed') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set business_status='cancelled', cancelled_at=now(), public_cancel_reason=p_public_reason, internal_cancel_note=p_internal_note where id=p_id;
  update public.event_reminders set status='cancelled' where event_id=p_id and status='scheduled';
  update public.event_registrations set promotion_status='expired' where event_id=p_id and promotion_status='offered';
  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
    select distinct user_id,'event_cancelled','Подію скасовано',p_public_reason,'event',p_id::text
    from public.event_registrations where event_id=p_id and status in ('pending','registered','waitlisted');
  perform public._net_audit(v_actor,'event_cancelled','event',p_id::text,null,jsonb_build_object('reason',p_public_reason),p_request_id);
  perform public._net_analytics(v_actor,'event_cancelled',jsonb_build_object('event',p_id));
  return jsonb_build_object('ok',true,'business_status','cancelled');
end $$;

create or replace function public.complete_event(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events;
begin
  if not (public.is_event_manager(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  select * into e from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if e.business_status not in ('published','postponed') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set business_status='completed', completed_at=now() where id=p_id;
  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
    select distinct user_id,'event_feedback_requested','Подія завершилась','Залиште відгук','event',p_id::text
    from public.event_registrations where event_id=p_id and status in ('registered','attended');
  perform public._net_audit(v_actor,'event_completed','event',p_id::text,null,jsonb_build_object('business','completed'),p_request_id);
  return jsonb_build_object('ok',true,'business_status','completed');
end $$;

create or replace function public.archive_event(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_bs event_business_status;
begin
  if not public.has_admin_role('event_manager') then raise exception 'forbidden' using errcode='42501'; end if;
  select business_status into v_bs from public.events where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_bs not in ('completed','cancelled') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set business_status='archived', archived_at=now(), status='archived'::moderation_status where id=p_id;
  perform public._net_audit(v_actor,'event_archived','event',p_id::text,null,jsonb_build_object('business','archived'),p_request_id);
  return jsonb_build_object('ok',true,'business_status','archived');
end $$;

-- ============================================================
-- ATTENDANCE / online link / feedback
-- ============================================================
create or replace function public.mark_event_attendance(p_reg uuid, p_state text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.event_registrations; v_status event_reg_status;
begin
  if p_state not in ('attended','no_show','unknown') then raise exception 'validation: state' using errcode='P0001'; end if;
  select * into r from public.event_registrations where id=p_reg for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if not (public.is_event_manager(r.event_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  v_status := case p_state when 'attended' then 'attended' when 'no_show' then 'no_show' else r.status end;
  perform set_config('app.privileged_write','1',true);
  insert into public.event_attendance(event_id,registration_id,user_id,state,marked_by)
    values (r.event_id,p_reg,r.user_id,p_state,v_actor)
    on conflict (registration_id) do update set state=excluded.state, marked_by=excluded.marked_by, marked_at=now();
  if p_state in ('attended','no_show') then
    update public.event_registrations set status=v_status where id=p_reg;
  end if;
  perform public._net_audit(v_actor,'event_attendance_marked','event_registration',p_reg::text,null,jsonb_build_object('state',p_state),p_request_id);
  perform public._net_analytics(v_actor,'event_attendance_marked',jsonb_build_object('event',r.event_id,'state',p_state));
  return jsonb_build_object('ok',true,'state',p_state);
end $$;

create or replace function public.bulk_mark_event_attendance(p_event uuid, p_items jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); it jsonb; okc int := 0; errc int := 0; errs jsonb := '[]'::jsonb;
begin
  if not (public.is_event_manager(p_event) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  for it in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    begin
      perform public.mark_event_attendance((it->>'registration_id')::uuid, it->>'state', p_request_id);
      okc := okc + 1;
    exception when others then errc := errc + 1; errs := errs || jsonb_build_object('registration_id',it->>'registration_id','error',sqlerrm);
    end;
  end loop;
  return jsonb_build_object('ok',true,'marked',okc,'errors',errc,'error_details',errs);
end $$;

create or replace function public.update_private_online_link(p_id uuid, p_url text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not (public.is_event_manager(p_id) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.events set online_private_url=p_url where id=p_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
    select distinct user_id,'event_online_link','Оновлено онлайн-доступ','','event',p_id::text
    from public.event_registrations where event_id=p_id and status in ('registered','attended');
  perform public._net_audit(v_actor,'event_online_link_changed','event',p_id::text,null,null,p_request_id);
  return jsonb_build_object('ok',true);
end $$;

-- контакти/лінк учасника — лише для зареєстрованого і лише коли policy дозволяє
create or replace function public.get_event_access(p_event uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); e public.events; r public.event_registrations;
begin
  select * into e from public.events where id=p_event and deleted_at is null;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  select * into r from public.event_registrations where event_id=p_event and user_id=v_actor;
  if not found or r.status not in ('registered','attended') then raise exception 'forbidden: лише для учасників' using errcode='42501'; end if;
  return jsonb_build_object('ok',true,'online_private_url',e.online_private_url,'online_platform',e.online_platform,'venue_name',e.venue_name,'address',e.address,'starts_at',e.starts_at,'timezone',e.timezone);
end $$;

create or replace function public.submit_event_feedback(p_event uuid, p_attended boolean default null, p_useful boolean default null, p_connections boolean default null, p_wants_similar boolean default null, p_comment text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists (select 1 from public.events where id=p_event and business_status in ('completed','archived')) then raise exception 'validation: подія ще не завершена' using errcode='P0001'; end if;
  insert into public.event_feedback(event_id,user_id,attended,useful,made_connections,wants_similar,comment)
    values (p_event,v_actor,p_attended,p_useful,p_connections,p_wants_similar,p_comment)
    on conflict (event_id,user_id) do update set attended=excluded.attended, useful=excluded.useful, made_connections=excluded.made_connections, wants_similar=excluded.wants_similar, comment=excluded.comment;
  perform public._net_analytics(v_actor,'event_feedback_submitted',jsonb_build_object('event',p_event));
  return jsonb_build_object('ok',true);
end $$;

-- ============================================================
-- speakers / partners (editor CRUD через RPC для зручності web)
-- ============================================================
create or replace function public.upsert_event_speaker(p_event uuid, p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if not (public.is_event_editor(p_event) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  if (p_patch->>'id') is not null then
    update public.event_speakers set name=coalesce(p_patch->>'name',name), headline=coalesce(p_patch->>'headline',headline),
      organization_name=coalesce(p_patch->>'organization_name',organization_name), bio=coalesce(p_patch->>'bio',bio),
      profile_id=coalesce(nullif(p_patch->>'profile_id','')::uuid,profile_id), sort_order=coalesce((p_patch->>'sort_order')::int,sort_order)
      where id=(p_patch->>'id')::uuid and event_id=p_event returning id into v_id;
  else
    insert into public.event_speakers(event_id,profile_id,name,headline,organization_name,bio,sort_order)
      values (p_event, nullif(p_patch->>'profile_id','')::uuid, coalesce(p_patch->>'name','Спікер'), p_patch->>'headline', p_patch->>'organization_name', p_patch->>'bio', coalesce((p_patch->>'sort_order')::int,0))
      returning id into v_id;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

create or replace function public.upsert_event_partner(p_event uuid, p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if not (public.is_event_editor(p_event) or public.has_admin_role('event_manager')) then raise exception 'forbidden' using errcode='42501'; end if;
  if (p_patch->>'id') is not null then
    update public.event_partners set name=coalesce(p_patch->>'name',name), partner_type=coalesce((p_patch->>'partner_type')::event_partner_type,partner_type),
      external_url=coalesce(p_patch->>'external_url',external_url), organization_id=coalesce(nullif(p_patch->>'organization_id','')::uuid,organization_id),
      sort_order=coalesce((p_patch->>'sort_order')::int,sort_order)
      where id=(p_patch->>'id')::uuid and event_id=p_event returning id into v_id;
  else
    insert into public.event_partners(event_id,organization_id,name,partner_type,external_url,sort_order)
      values (p_event, nullif(p_patch->>'organization_id','')::uuid, coalesce(p_patch->>'name','Партнер'), coalesce((p_patch->>'partner_type')::event_partner_type,'other'), p_patch->>'external_url', coalesce((p_patch->>'sort_order')::int,0))
      returning id into v_id;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

-- ============================================================
-- CRON (ідемпотентно, service_role)
-- ============================================================
create or replace function public.events_cron()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pub int; v_close int; v_done int; v_exp jsonb;
begin
  perform set_config('app.privileged_write','1',true);
  -- 1. публікація запланованих
  with upd as (update public.events set business_status='published', status='published'::moderation_status, published_at=coalesce(published_at,now())
    where business_status='scheduled' and moderation='approved' and scheduled_publish_at is not null and scheduled_publish_at <= now() and deleted_at is null
    returning id) select count(*) into v_pub from upd;
  -- 2. закриття реєстрації після дедлайну (переводимо mode → disabled)
  with upd as (update public.events set registration_mode='disabled'
    where business_status='published' and registration_mode<>'disabled' and registration_deadline_at is not null and registration_deadline_at < now() and deleted_at is null
    returning id) select count(*) into v_close from upd;
  -- 3. завершення минулих подій
  with upd as (update public.events set business_status='completed', completed_at=now()
    where business_status in ('published','postponed') and ends_at is not null and ends_at < now() and deleted_at is null
    returning id) select count(*) into v_done from upd;
  -- 4. протерміновані waitlist-офери
  v_exp := public.expire_waitlist_offers();
  return jsonb_build_object('ok',true,'published',v_pub,'registration_closed',v_close,'completed',v_done,'waitlist_expired',v_exp);
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'create_event_draft(uuid,jsonb,text)','update_event_draft(uuid,jsonb,integer,text)',
    'submit_event_for_moderation(uuid,text)','admin_approve_event(uuid,boolean,text)',
    'admin_request_event_changes(uuid,text,text)','admin_reject_event(uuid,text,text)',
    'schedule_event_publication(uuid,timestamptz,text)','publish_event(uuid,text)',
    'register_for_event(uuid,jsonb,boolean,boolean,text,text)','cancel_event_registration(uuid,text)',
    'approve_event_registration(uuid,text)','reject_event_registration(uuid,text,text)','move_registration_to_waitlist(uuid,text)',
    'accept_waitlist_place(uuid,text)','decline_waitlist_place(uuid,text)','promote_next_waitlist_participant(uuid,integer)',
    'reschedule_event(uuid,timestamptz,timestamptz,text,text)','cancel_event(uuid,text,text,text)','complete_event(uuid,text)','archive_event(uuid,text)',
    'mark_event_attendance(uuid,text,text)','bulk_mark_event_attendance(uuid,jsonb,text)',
    'update_private_online_link(uuid,text,text)','get_event_access(uuid)',
    'submit_event_feedback(uuid,boolean,boolean,boolean,boolean,text,text)',
    'upsert_event_speaker(uuid,jsonb,text)','upsert_event_partner(uuid,jsonb,text)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
revoke all on function public.events_cron() from public, anon, authenticated;
grant execute on function public.events_cron() to service_role;
revoke all on function public.expire_waitlist_offers() from public, anon, authenticated;
grant execute on function public.expire_waitlist_offers() to service_role;
