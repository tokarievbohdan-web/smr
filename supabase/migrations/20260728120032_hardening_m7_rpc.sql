-- ============================================================
-- 032 · Milestone 7 — hardening: RPC (SECURITY DEFINER + fixed search_path)
-- ============================================================

-- ---------- feature flags ----------
create or replace function public.set_feature_flag(p_key text, p_enabled boolean, p_environments text[] default '{}', p_audience jsonb default '{}'::jsonb, p_description text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('super_admin') then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.feature_flags(key,enabled,environments,audience,description,updated_by,updated_at)
    values (p_key,p_enabled,coalesce(p_environments,'{}'),coalesce(p_audience,'{}'::jsonb),p_description,v_actor,now())
    on conflict (key) do update set enabled=excluded.enabled, environments=excluded.environments,
      audience=excluded.audience, description=coalesce(excluded.description,public.feature_flags.description), updated_by=v_actor, updated_at=now();
  perform public._net_audit(v_actor,'feature_flag_set','feature_flag',p_key,null,jsonb_build_object('enabled',p_enabled),null);
  return jsonb_build_object('ok',true,'key',p_key,'enabled',p_enabled);
end $$;

create or replace function public.is_feature_enabled(p_key text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare f public.feature_flags; v_env text := coalesce(current_setting('app.environment', true),'production'); v_cohorts text[]; aud jsonb;
begin
  select * into f from public.feature_flags where key = p_key;
  if not found then return false; end if;
  if not f.enabled then return false; end if;
  if array_length(f.environments,1) is not null and not (v_env = any(f.environments)) then return false; end if;
  aud := f.audience;
  if aud is null or aud = '{}'::jsonb then return true; end if;
  -- цільова аудиторія: якщо задано users/orgs/cohorts — користувач має збігтись
  if (aud ? 'users') and (auth.uid()::text = any(select jsonb_array_elements_text(aud->'users'))) then return true; end if;
  if (aud ? 'cohorts') then
    select cohorts into v_cohorts from public.profiles where id = auth.uid();
    if v_cohorts is not null and exists (select 1 from jsonb_array_elements_text(aud->'cohorts') c where c.value = any(v_cohorts)) then return true; end if;
  end if;
  if (aud ? 'orgs') and exists (
    select 1 from public.organization_members m where m.user_id = auth.uid() and m.status='active'
      and m.org_id::text = any(select jsonb_array_elements_text(aud->'orgs'))) then return true; end if;
  -- аудиторія задана, але користувач не входить
  return false;
end $$;

-- ---------- beta invitations ----------
create or replace function public.create_beta_invitation(p_code_hash text, p_email text default null, p_org uuid default null, p_cohort text default null, p_max_uses int default 1, p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if not public.has_admin_role('super_admin') then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.beta_invitations(email,code_hash,invited_by,organization_id,cohort,max_uses,expires_at)
    values (nullif(p_email,''),nullif(p_code_hash,''),v_actor,p_org,p_cohort,greatest(coalesce(p_max_uses,1),1),p_expires_at) returning id into v_id;
  perform public._net_audit(v_actor,'beta_invitation_created','beta_invitation',v_id::text,null,jsonb_build_object('cohort',p_cohort),null);
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

-- redeem: приймає ВЖЕ хешований код (sha256 з Next-шару). Raw код у БД не потрапляє.
create or replace function public.redeem_beta_invitation(p_code_hash text, p_email text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); inv public.beta_invitations;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into inv from public.beta_invitations
    where status='active' and (expires_at is null or expires_at > now()) and uses_count < max_uses
      and ((p_code_hash is not null and code_hash = p_code_hash) or (p_email is not null and lower(email)=lower(p_email)))
    order by created_at limit 1 for update;
  if not found then raise exception 'validation: недійсний або використаний інвайт' using errcode='P0001'; end if;
  update public.beta_invitations set uses_count = uses_count + 1,
    status = case when uses_count + 1 >= max_uses then 'used' else status end,
    accepted_at = coalesce(accepted_at, now()), accepted_by = coalesce(accepted_by, v_actor)
    where id = inv.id;
  if inv.cohort is not null then
    update public.profiles set cohorts = (select array(select distinct unnest(cohorts || array[inv.cohort]))) where id = v_actor;
  end if;
  if inv.organization_id is not null then
    insert into public.organization_members(org_id,user_id,role,status) values (inv.organization_id,v_actor,'member','active')
    on conflict do nothing;
  end if;
  perform public._net_audit(v_actor,'beta_invitation_redeemed','beta_invitation',inv.id::text,null,jsonb_build_object('cohort',inv.cohort),null);
  return jsonb_build_object('ok',true,'cohort',inv.cohort);
end $$;

-- ---------- notification preferences ----------
create or replace function public.upsert_notification_preferences(p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_chan jsonb; v_cat jsonb;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  v_chan := coalesce(p_patch->'channels', '{}'::jsonb);
  v_cat := coalesce(p_patch->'categories', '{}'::jsonb);
  insert into public.notification_preferences(user_id,channels,categories,quiet_hours_start,quiet_hours_end,timezone,reminder_frequency,updated_at)
    values (v_actor,
      '{"in_app":true,"push":true,"email":true}'::jsonb || v_chan,
      v_cat,
      (p_patch->>'quiet_hours_start')::int, (p_patch->>'quiet_hours_end')::int,
      coalesce(p_patch->>'timezone','Europe/Kyiv'), coalesce(p_patch->>'reminder_frequency','default'), now())
    on conflict (user_id) do update set
      channels = public.notification_preferences.channels || v_chan,
      categories = public.notification_preferences.categories || v_cat,
      quiet_hours_start = coalesce((p_patch->>'quiet_hours_start')::int, public.notification_preferences.quiet_hours_start),
      quiet_hours_end = coalesce((p_patch->>'quiet_hours_end')::int, public.notification_preferences.quiet_hours_end),
      timezone = coalesce(p_patch->>'timezone', public.notification_preferences.timezone),
      reminder_frequency = coalesce(p_patch->>'reminder_frequency', public.notification_preferences.reminder_frequency),
      updated_at = now();
  -- security-сповіщення не можна вимкнути повністю: примусово вмикаємо канал безпеки
  update public.notification_preferences
    set categories = categories || jsonb_build_object('security', jsonb_build_object('in_app',true,'push',true,'email',true))
    where user_id = v_actor;
  return jsonb_build_object('ok',true);
end $$;

-- ---------- devices / push tokens ----------
create or replace function public.register_device(p_platform text, p_push_token text, p_device_id text default null, p_app_version text default null, p_environment text default 'production')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_push_token),'')='' then raise exception 'validation: push_token' using errcode='P0001'; end if;
  -- запобігання передачі токена іншому користувачу після logout: інвалідовуємо чужі рядки з цим токеном
  update public.devices set invalidated_at = now() where push_token = p_push_token and user_id <> v_actor and invalidated_at is null;
  insert into public.devices(user_id,platform,device_id,push_token,app_version,environment,last_seen_at,invalidated_at)
    values (v_actor,p_platform,p_device_id,p_push_token,p_app_version,coalesce(p_environment,'production'),now(),null)
  on conflict (user_id,push_token) do update set platform=excluded.platform, device_id=excluded.device_id,
    app_version=excluded.app_version, environment=excluded.environment, last_seen_at=now(), invalidated_at=null
  returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

create or replace function public.invalidate_device(p_device_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  update public.devices set invalidated_at = now() where id = p_device_id and user_id = v_actor;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  return jsonb_build_object('ok',true);
end $$;

-- logout cleanup: інвалідувати всі токени користувача
create or replace function public.invalidate_my_devices()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); c int;
begin
  update public.devices set invalidated_at = now() where user_id = v_actor and invalidated_at is null;
  get diagnostics c = row_count;
  return jsonb_build_object('ok',true,'invalidated',c);
end $$;

-- ---------- consent ----------
create or replace function public.record_consent(p_type text, p_version text, p_source text default 'web')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.user_consents(user_id,consent_type,document_version,accepted_at,source)
    values (v_actor,p_type,p_version,now(),p_source);
  return jsonb_build_object('ok',true);
end $$;
create or replace function public.revoke_consent(p_type text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if p_type = 'security' then raise exception 'validation: security-згоду не можна відкликати' using errcode='P0001'; end if;
  update public.user_consents set revoked_at = now() where user_id = v_actor and consent_type = p_type and revoked_at is null;
  return jsonb_build_object('ok',true);
end $$;

-- ---------- feedback ----------
create or replace function public.submit_feedback(p_type text, p_message text, p_entity_type text default null, p_entity_id text default null, p_app_version text default null, p_platform text default null, p_screen text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if coalesce(trim(p_message),'')='' then raise exception 'validation: повідомлення' using errcode='P0001'; end if;
  insert into public.feedback(user_id,type,message,entity_type,entity_id,app_version,platform,screen)
    values (v_actor, coalesce(p_type,'other')::feedback_type, left(p_message,4000), p_entity_type, p_entity_id, p_app_version, p_platform, p_screen)
    returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end $$;
create or replace function public.update_feedback_status(p_id uuid, p_status text, p_priority text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update public.feedback set status = p_status::feedback_status, priority = coalesce(p_priority,priority), assigned_to = coalesce(assigned_to,v_actor) where id = p_id;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform public._net_audit(v_actor,'feedback_status','feedback',p_id::text,null,jsonb_build_object('status',p_status),null);
  return jsonb_build_object('ok',true);
end $$;

-- ---------- account deletion (soft, з grace-period) ----------
create or replace function public.request_account_deletion(p_grace_days int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_eff timestamptz;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  v_eff := now() + make_interval(days => greatest(coalesce(p_grace_days,30),1));
  update public.profiles set deletion_requested_at = now(), deletion_effective_at = v_eff where id = v_actor;
  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
    values (v_actor,'account_deletion_requested','Запит на видалення акаунта','Акаунт буде видалено після завершення періоду очікування','account',v_actor::text);
  perform public._net_audit(v_actor,'account_deletion_requested','account',v_actor::text,null,jsonb_build_object('effective',v_eff),null);
  return jsonb_build_object('ok',true,'effective_at',v_eff);
end $$;
create or replace function public.cancel_account_deletion()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  update public.profiles set deletion_requested_at = null, deletion_effective_at = null where id = v_actor;
  perform public._net_audit(v_actor,'account_deletion_cancelled','account',v_actor::text,null,null,null);
  return jsonb_build_object('ok',true);
end $$;

-- ---------- data export (лише власні дані; без чужих/внутрішніх) ----------
create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); res jsonb;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'verification_note' from public.profiles p where p.id = v_actor),
    'bookmarks', (select coalesce(jsonb_agg(jsonb_build_object('entity_type',entity_type,'entity_id',entity_id,'created_at',created_at)),'[]'::jsonb) from public.bookmarks where user_id = v_actor),
    'applications', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status,'submitted_at',submitted_at)),'[]'::jsonb) from public.applications where user_id = v_actor and deleted_at is null),
    'event_registrations', (select coalesce(jsonb_agg(jsonb_build_object('event_id',event_id,'status',status,'registered_at',registered_at)),'[]'::jsonb) from public.event_registrations where user_id = v_actor),
    'introductions', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'subject',subject,'status',status,'created_at',created_at)),'[]'::jsonb) from public.introductions where requester_id = v_actor and deleted_at is null),
    'notification_preferences', (select to_jsonb(np) from public.notification_preferences np where np.user_id = v_actor),
    'consents', (select coalesce(jsonb_agg(jsonb_build_object('type',consent_type,'version',document_version,'accepted_at',accepted_at,'revoked_at',revoked_at)),'[]'::jsonb) from public.user_consents where user_id = v_actor),
    'exported_at', now()
  ) into res;
  perform public._net_audit(v_actor,'data_export','account',v_actor::text,null,null,null);
  return res;
end $$;

-- ---------- data quality (analyst/super_admin) ----------
create or replace function public.data_quality_report()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_admin_role('analyst') or public.has_admin_role('super_admin')) then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'profiles_no_name', (select count(*) from public.profiles where coalesce(trim(display_name),'')='' and deleted_at is null),
    'orgs_no_owner', (select count(*) from public.organizations o where o.deleted_at is null and o.owner_id is null),
    'events_over_capacity', (select count(*) from public.events e where e.capacity is not null and e.registered_count > e.capacity and e.deleted_at is null),
    'waitlist_offers_no_expiry', (select count(*) from public.event_registrations where promotion_status='offered' and promotion_expires_at is null),
    'active_opps_expired', (select count(*) from public.opportunities where business_status='active' and expiration_date is not null and expiration_date < current_date and deleted_at is null),
    'intros_missing_party', (select count(*) from public.introductions where deleted_at is null and (requester_id is null or (target_profile_id is null and target_organization_id is null and target_user_id is null))),
    'notifications_no_entity', (select count(*) from public.notifications where entity_type is null and deleted_at is null),
    'generated_at', now()
  );
end $$;

-- ---------- admin metrics (будь-який адмін) ----------
create or replace function public.admin_metrics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'users_total', (select count(*) from public.profiles where deleted_at is null),
    'profiles_verified', (select count(*) from public.profiles where verification_status='verified' and deleted_at is null),
    'orgs_approved', (select count(*) from public.organizations where moderation='approved' and deleted_at is null),
    'articles_published', (select count(*) from public.articles where status='published' and deleted_at is null),
    'opportunities_active', (select count(*) from public.opportunities where business_status='active' and deleted_at is null),
    'applications_total', (select count(*) from public.applications where deleted_at is null),
    'introductions_total', (select count(*) from public.introductions where deleted_at is null),
    'events_published', (select count(*) from public.events where business_status in ('published','postponed','completed') and deleted_at is null),
    'registrations_total', (select count(*) from public.event_registrations where status in ('registered','attended')),
    'reports_open', (select count(*) from public.reports where status='open'),
    'feedback_new', (select count(*) from public.feedback where status='new'),
    'moderation_backlog', (select
       (select count(*) from public.opportunities where moderation='pending' and deleted_at is null)
     + (select count(*) from public.events where moderation='pending' and deleted_at is null)
     + (select count(*) from public.organizations where moderation='pending' and deleted_at is null)),
    'delivery_failures', (select count(*) from public.notification_deliveries where status='failed'),
    'generated_at', now()
  );
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'set_feature_flag(text,boolean,text[],jsonb,text)','create_beta_invitation(text,text,uuid,text,integer,timestamptz)',
    'redeem_beta_invitation(text,text)','upsert_notification_preferences(jsonb)',
    'register_device(text,text,text,text,text)','invalidate_device(uuid)','invalidate_my_devices()',
    'record_consent(text,text,text)','revoke_consent(text)','submit_feedback(text,text,text,text,text,text,text)',
    'update_feedback_status(uuid,text,text)','request_account_deletion(integer)','cancel_account_deletion()',
    'export_my_data()','data_quality_report()','admin_metrics()'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
-- is_feature_enabled доступна усім ролям (для публічної видимості flag-ів)
revoke all on function public.is_feature_enabled(text) from public;
grant execute on function public.is_feature_enabled(text) to anon, authenticated, service_role;
