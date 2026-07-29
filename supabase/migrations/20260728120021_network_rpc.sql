-- ============================================================
-- 021 · Milestone 3 — Network: атомарні RPC (SECURITY DEFINER, fixed search_path,
-- перевірка ролі/ownership, whitelist полів, audit + notifications, ідемпотентність).
-- ============================================================

-- ---------- helpers ----------
create or replace function public._net_audit(p_actor uuid, p_action text, p_etype text, p_eid text, p_old jsonb, p_new jsonb, p_req text)
returns void language sql set search_path = public as $$
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
  values (p_actor, public.current_admin_role()::text, p_action, p_etype, p_eid, p_old, p_new, p_req);
$$;
create or replace function public._net_notify(p_uid uuid, p_type text, p_title text, p_body text, p_etype text, p_eid text)
returns void language sql set search_path = public as $$
  insert into public.notifications(user_id, type, title, body, entity_type, entity_id)
  select p_uid, p_type, p_title, p_body, p_etype, p_eid where p_uid is not null;
$$;
create or replace function public._unique_org_slug(p_base text, p_org uuid)
returns text language plpgsql set search_path = public as $$
declare s text := coalesce(public.slugify(p_base),'org'); c text := s; i int := 2;
begin
  while exists (select 1 from public.organizations where slug=c and deleted_at is null and (p_org is null or id<>p_org)) loop
    c := s||'-'||i; i := i+1; end loop;
  return c;
end $$;
create or replace function public._jarr(p jsonb, k text)
returns text[] language sql immutable as $$
  select case when p ? k then array(select jsonb_array_elements_text(p->k)) else null end;
$$;

-- ============================================================
-- PROFILE
-- ============================================================
create or replace function public.update_own_profile(p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_ver int; v_avail text[];
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select version into v_ver from public.profiles where id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_expected_version is not null and p_expected_version <> v_ver then raise exception 'version_conflict' using errcode='40001'; end if;
  v_avail := public._jarr(p_patch,'availability_statuses');
  if v_avail is not null and 'not_looking' = any(v_avail) and array_length(v_avail,1) > 1 then
    raise exception 'validation: not_looking конфліктує з іншими статусами' using errcode='P0001';
  end if;
  update public.profiles set
    first_name=coalesce(p_patch->>'first_name',first_name), last_name=coalesce(p_patch->>'last_name',last_name),
    display_name=coalesce(p_patch->>'display_name',display_name), headline=coalesce(p_patch->>'headline',headline),
    current_position=coalesce(p_patch->>'current_position',current_position),
    current_organization_id=coalesce(nullif(p_patch->>'current_organization_id','')::uuid,current_organization_id),
    city=coalesce(p_patch->>'city',city), region=coalesce(p_patch->>'region',region), country=coalesce(p_patch->>'country',country),
    bio=coalesce(p_patch->>'bio',bio), avatar=coalesce(p_patch->>'avatar',avatar),
    avatar_media_id=coalesce(nullif(p_patch->>'avatar_media_id','')::uuid,avatar_media_id),
    website=coalesce(p_patch->>'website',website), linkedin_url=coalesce(p_patch->>'linkedin_url',linkedin_url),
    public_email=coalesce(p_patch->>'public_email',public_email), public_phone=coalesce(p_patch->>'public_phone',public_phone),
    other_social_links=coalesce(p_patch->'other_social_links',other_social_links),
    contact_visibility=coalesce((p_patch->>'contact_visibility')::contact_visibility,contact_visibility),
    profile_visibility=coalesce((p_patch->>'profile_visibility')::profile_visibility,profile_visibility),
    languages=coalesce(public._jarr(p_patch,'languages'),languages),
    sports=coalesce(public._jarr(p_patch,'sports'),sports),
    professional_categories=coalesce(public._jarr(p_patch,'professional_categories'),professional_categories),
    skills=coalesce(public._jarr(p_patch,'skills'),skills),
    availability_statuses=coalesce(v_avail,availability_statuses),
    onboarding_completed=coalesce((p_patch->>'onboarding_completed')::boolean,onboarding_completed),
    updated_at=now()
  where id=v_actor;
  perform public._net_audit(v_actor,'profile_updated','profile',v_actor::text,jsonb_build_object('version',v_ver),jsonb_build_object('version',v_ver+1),p_request_id);
  return jsonb_build_object('ok',true,'id',v_actor,'version',v_ver+1);
end $$;

create or replace function public.submit_profile_for_verification(p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); p public.profiles;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into p from public.profiles where id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if coalesce(trim(p.first_name),'')='' or coalesce(trim(p.last_name),'')='' or coalesce(trim(p.headline),'')=''
     or coalesce(array_length(p.sports,1),0) < 1 or coalesce(array_length(p.professional_categories,1),0) < 1
     or coalesce(array_length(p.skills,1),0) < 3 then
    raise exception 'validation: профіль неповний для верифікації' using errcode='P0001';
  end if;
  if p.verification_status = 'verified' then return jsonb_build_object('ok',true,'status','verified'); end if;
  perform set_config('app.privileged_write','1',true);
  update public.profiles set verification_status='pending', verification_submitted_at=now(), verification_note=null where id=v_actor;
  perform public._net_audit(v_actor,'profile_submitted','profile',v_actor::text,null,jsonb_build_object('status','pending'),p_request_id);
  return jsonb_build_object('ok',true,'status','pending');
end $$;

create or replace function public.admin_set_profile_verification(p_id uuid, p_status verification_status, p_note text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_old verification_status;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  select verification_status into v_old from public.profiles where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.profiles set
    verification_status=p_status,
    verified = (p_status='verified'),
    verified_at = case when p_status='verified' then now() else null end,
    verified_by = case when p_status='verified' then v_actor else null end,
    verification_note = case when p_status in ('rejected','changes_required') then p_note else null end
  where id=p_id;
  perform public._net_audit(v_actor,'profile_verification_'||p_status::text,'profile',p_id::text,jsonb_build_object('status',v_old),jsonb_build_object('status',p_status),p_request_id);
  perform public._net_notify(p_id,'profile_verification_'||p_status::text,'Статус верифікації профілю',coalesce(p_note,p_status::text),'profile',p_id::text);
  return jsonb_build_object('ok',true,'status',p_status);
end $$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create or replace function public.create_organization_draft(p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_slug text; v_name text;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  v_name := coalesce(p_patch->>'name',''); if trim(v_name)='' then raise exception 'validation: назва обовʼязкова' using errcode='P0001'; end if;
  v_id := gen_random_uuid(); v_slug := public._unique_org_slug(v_name, v_id);
  perform set_config('app.privileged_write','1',true);
  insert into public.organizations(id,name,slug,normalized_name,short_desc,full_desc,organization_type_id,city,region,country,website,
      moderation,verification,owner_id,created_by,status,verified)
  values (v_id,v_name,v_slug,lower(regexp_replace(v_name,'[^a-z0-9а-яіїєґ]+','','g')),
      p_patch->>'short_desc',p_patch->>'full_desc',nullif(p_patch->>'organization_type_id','')::uuid,
      p_patch->>'city',p_patch->>'region',p_patch->>'country',p_patch->>'website',
      'draft','unverified',v_actor,v_actor,'draft'::moderation_status,false);
  insert into public.organization_members(org_id,user_id,role,status,is_public,job_title)
    values (v_id,v_actor,'owner','active',true,'Owner') on conflict (org_id,user_id) do nothing;
  perform public._net_audit(v_actor,'organization_created','organization',v_id::text,null,jsonb_build_object('slug',v_slug),p_request_id);
  return jsonb_build_object('ok',true,'id',v_id,'slug',v_slug,'moderation','draft');
end $$;

create or replace function public.update_organization(p_id uuid, p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_ver int;
begin
  if not (public.is_org_editor(p_id) or public.has_admin_role('moderator')) then raise exception 'forbidden' using errcode='42501'; end if;
  select version into v_ver from public.organizations where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_expected_version is not null and p_expected_version <> v_ver then raise exception 'version_conflict' using errcode='40001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.organizations set
    name=coalesce(p_patch->>'name',name), short_desc=coalesce(p_patch->>'short_desc',short_desc), full_desc=coalesce(p_patch->>'full_desc',full_desc),
    organization_type_id=coalesce(nullif(p_patch->>'organization_type_id','')::uuid,organization_type_id),
    city=coalesce(p_patch->>'city',city), region=coalesce(p_patch->>'region',region), country=coalesce(p_patch->>'country',country),
    address=coalesce(p_patch->>'address',address), website=coalesce(p_patch->>'website',website),
    public_email=coalesce(p_patch->>'public_email',public_email), public_phone=coalesce(p_patch->>'public_phone',public_phone),
    logo=coalesce(p_patch->>'logo',logo), logo_media_id=coalesce(nullif(p_patch->>'logo_media_id','')::uuid,logo_media_id),
    cover=coalesce(p_patch->>'cover',cover), cover_media_id=coalesce(nullif(p_patch->>'cover_media_id','')::uuid,cover_media_id),
    founded_year=coalesce((p_patch->>'founded_year')::int,founded_year), team_size_range=coalesce(p_patch->>'team_size_range',team_size_range),
    audience_size=coalesce(p_patch->>'audience_size',audience_size), social_links=coalesce(p_patch->'social_links',social_links),
    sports=coalesce(public._jarr(p_patch,'sports'),sports), services=coalesce(public._jarr(p_patch,'services'),services),
    directions=coalesce(public._jarr(p_patch,'directions'),directions),
    commercial_directions=coalesce(public._jarr(p_patch,'commercial_directions'),commercial_directions),
    professional_categories=coalesce(public._jarr(p_patch,'professional_categories'),professional_categories),
    partners=coalesce(public._jarr(p_patch,'partners'),partners), updated_at=now()
  where id=p_id;
  perform public._net_audit(v_actor,'organization_updated','organization',p_id::text,jsonb_build_object('version',v_ver),jsonb_build_object('version',v_ver+1),p_request_id);
  return jsonb_build_object('ok',true,'id',p_id,'version',v_ver+1);
end $$;

create or replace function public.submit_organization_for_moderation(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_mod org_moderation_status; v_owner uuid;
begin
  if not (public.is_org_manager(p_id) or public.has_admin_role('moderator')) then raise exception 'forbidden' using errcode='42501'; end if;
  select moderation, owner_id into v_mod, v_owner from public.organizations where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_mod not in ('draft','changes_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.organizations set moderation='pending' where id=p_id;
  perform public._net_audit(v_actor,'organization_submitted','organization',p_id::text,jsonb_build_object('moderation',v_mod),jsonb_build_object('moderation','pending'),p_request_id);
  return jsonb_build_object('ok',true,'moderation','pending');
end $$;

create or replace function public.admin_set_org_moderation(p_id uuid, p_status org_moderation_status, p_note text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_old org_moderation_status; v_owner uuid;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  select moderation, owner_id into v_old, v_owner from public.organizations where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.organizations set moderation=p_status,
    moderation_note = case when p_status in ('changes_required','rejected') then p_note else null end
  where id=p_id;
  perform public._net_audit(v_actor,'organization_'||p_status::text,'organization',p_id::text,jsonb_build_object('moderation',v_old),jsonb_build_object('moderation',p_status),p_request_id);
  perform public._net_notify(v_owner,'organization_'||p_status::text,'Статус організації',coalesce(p_note,p_status::text),'organization',p_id::text);
  return jsonb_build_object('ok',true,'moderation',p_status);
end $$;

create or replace function public.admin_set_org_verification(p_id uuid, p_status verification_status, p_note text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_old verification_status; v_owner uuid;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  select verification, owner_id into v_old, v_owner from public.organizations where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.organizations set verification=p_status, verified=(p_status='verified'),
    verified_at=case when p_status='verified' then now() else null end,
    verified_by=case when p_status='verified' then v_actor else null end
  where id=p_id;
  perform public._net_audit(v_actor,'organization_verification_'||p_status::text,'organization',p_id::text,jsonb_build_object('verification',v_old),jsonb_build_object('verification',p_status),p_request_id);
  perform public._net_notify(v_owner,'organization_verification_'||p_status::text,'Верифікація організації',coalesce(p_note,p_status::text),'organization',p_id::text);
  return jsonb_build_object('ok',true,'verification',p_status);
end $$;

-- ============================================================
-- ACCESS REQUESTS
-- ============================================================
create or replace function public.create_org_access_request(p_org uuid, p_role member_role default 'member', p_job text default null, p_reason text default null, p_proof text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_owner uuid;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if not public.is_org_public(p_org) then raise exception 'not_found' using errcode='P0002'; end if;
  if exists (select 1 from public.organization_members where org_id=p_org and user_id=v_actor and status='active') then
    raise exception 'validation: ви вже учасник' using errcode='P0001'; end if;
  begin
    insert into public.access_requests(org_id,user_id,requested_role,job_title,reason,proof_url,status)
      values (p_org,v_actor,p_role,p_job,p_reason,p_proof,'pending') returning id into v_id;
  exception when unique_violation then raise exception 'already active request' using errcode='23505'; end;
  select owner_id into v_owner from public.organizations where id=p_org;
  perform public._net_audit(v_actor,'access_requested','organization',p_org::text,null,jsonb_build_object('request',v_id),p_request_id);
  perform public._net_notify(v_owner,'organization_access_requested','Новий запит доступу','','access_request',v_id::text);
  return jsonb_build_object('ok',true,'id',v_id,'status','pending');
end $$;

create or replace function public.cancel_org_access_request(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_uid uuid;
begin
  select user_id into v_uid from public.access_requests where id=p_id for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_uid <> v_actor then raise exception 'forbidden' using errcode='42501'; end if;
  update public.access_requests set status='cancelled', resolved_at=now() where id=p_id and status in ('pending','under_review','information_required');
  return jsonb_build_object('ok',true,'status','cancelled');
end $$;

create or replace function public.admin_review_access_request(p_id uuid, p_action text, p_role member_role default null, p_note text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); r public.access_requests;
begin
  select * into r from public.access_requests where id=p_id for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if not (public.is_admin() or public.is_org_manager(r.org_id)) then raise exception 'forbidden' using errcode='42501'; end if;
  if p_action='approve' then
    insert into public.organization_members(org_id,user_id,role,status,is_public,job_title)
      values (r.org_id,r.user_id,coalesce(p_role,r.requested_role),'active',true,r.job_title)
      on conflict (org_id,user_id) do update set role=excluded.role, status='active', deleted_at=null, updated_at=now();
    update public.access_requests set status='approved', reviewed_by=v_actor, review_note=p_note, resolved_at=now() where id=p_id;
    perform public._net_audit(v_actor,'access_approved','organization',r.org_id::text,null,jsonb_build_object('user',r.user_id),p_request_id);
    perform public._net_notify(r.user_id,'organization_access_approved','Доступ надано','','organization',r.org_id::text);
    return jsonb_build_object('ok',true,'status','approved');
  elsif p_action='reject' then
    update public.access_requests set status='rejected', reviewed_by=v_actor, review_note=p_note, resolved_at=now() where id=p_id;
    perform public._net_notify(r.user_id,'organization_access_rejected','Запит відхилено',coalesce(p_note,''),'organization',r.org_id::text);
    return jsonb_build_object('ok',true,'status','rejected');
  elsif p_action='request_information' then
    update public.access_requests set status='information_required', reviewed_by=v_actor, review_note=p_note where id=p_id;
    perform public._net_notify(r.user_id,'organization_access_information_required','Потрібна інформація',coalesce(p_note,''),'access_request',p_id::text);
    return jsonb_build_object('ok',true,'status','information_required');
  else raise exception 'validation: невідома дія' using errcode='P0001'; end if;
end $$;

-- ============================================================
-- MEMBERS
-- ============================================================
create or replace function public.change_organization_member_role(p_org uuid, p_user uuid, p_role member_role, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_cur member_role; v_owners int;
begin
  if not (public.is_org_manager(p_org) or public.is_admin()) then raise exception 'forbidden' using errcode='42501'; end if;
  select role into v_cur from public.organization_members where org_id=p_org and user_id=p_user and status='active' for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_cur='owner' and p_role<>'owner' then
    select count(*) into v_owners from public.organization_members where org_id=p_org and role='owner' and status='active';
    if v_owners <= 1 then raise exception 'validation: не можна лишити організацію без owner' using errcode='P0001'; end if;
  end if;
  update public.organization_members set role=p_role, updated_at=now() where org_id=p_org and user_id=p_user;
  perform public._net_audit(v_actor,'member_role_changed','organization',p_org::text,jsonb_build_object('role',v_cur),jsonb_build_object('role',p_role),p_request_id);
  perform public._net_notify(p_user,'member_role_changed','Роль в організації змінено',p_role::text,'organization',p_org::text);
  return jsonb_build_object('ok',true,'role',p_role);
end $$;

create or replace function public.remove_organization_member(p_org uuid, p_user uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_cur member_role; v_owners int;
begin
  if not (public.is_org_manager(p_org) or public.is_admin()) then raise exception 'forbidden' using errcode='42501'; end if;
  select role into v_cur from public.organization_members where org_id=p_org and user_id=p_user and status='active' for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_cur='owner' then
    select count(*) into v_owners from public.organization_members where org_id=p_org and role='owner' and status='active';
    if v_owners <= 1 then raise exception 'validation: не можна видалити останнього owner' using errcode='P0001'; end if;
  end if;
  update public.organization_members set status='removed', deleted_at=now(), updated_at=now() where org_id=p_org and user_id=p_user;
  perform public._net_audit(v_actor,'member_removed','organization',p_org::text,jsonb_build_object('user',p_user),null,p_request_id);
  perform public._net_notify(p_user,'member_removed','Вас виключено з організації','','organization',p_org::text);
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.transfer_organization_ownership(p_org uuid, p_new_user uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_old_owner uuid;
begin
  if not public.has_admin_role('super_admin') then raise exception 'forbidden: super_admin only' using errcode='42501'; end if;
  select owner_id into v_old_owner from public.organizations where id=p_org and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  insert into public.organization_members(org_id,user_id,role,status,is_public)
    values (p_org,p_new_user,'owner','active',true)
    on conflict (org_id,user_id) do update set role='owner', status='active', deleted_at=null, updated_at=now();
  if v_old_owner is not null and v_old_owner <> p_new_user then
    update public.organization_members set role='manager', updated_at=now() where org_id=p_org and user_id=v_old_owner;
  end if;
  perform set_config('app.privileged_write','1',true);
  update public.organizations set owner_id=p_new_user where id=p_org;
  perform public._net_audit(v_actor,'ownership_transferred','organization',p_org::text,jsonb_build_object('owner',v_old_owner),jsonb_build_object('owner',p_new_user),p_request_id);
  perform public._net_notify(p_new_user,'member_role_changed','Ви тепер owner організації','','organization',p_org::text);
  return jsonb_build_object('ok',true,'owner',p_new_user);
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'update_own_profile(jsonb,integer,text)','submit_profile_for_verification(text)',
    'admin_set_profile_verification(uuid,verification_status,text,text)',
    'create_organization_draft(jsonb,text)','update_organization(uuid,jsonb,integer,text)',
    'submit_organization_for_moderation(uuid,text)','admin_set_org_moderation(uuid,org_moderation_status,text,text)',
    'admin_set_org_verification(uuid,verification_status,text,text)',
    'create_org_access_request(uuid,member_role,text,text,text,text)','cancel_org_access_request(uuid,text)',
    'admin_review_access_request(uuid,text,member_role,text,text)',
    'change_organization_member_role(uuid,uuid,member_role,text)','remove_organization_member(uuid,uuid,text)',
    'transfer_organization_ownership(uuid,uuid,text)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
