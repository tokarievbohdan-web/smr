-- ============================================================
-- 024 · Milestone 4 — Opportunities/Applications: атомарні RPC
-- SECURITY DEFINER + fixed search_path + перевірка ролі/ownership + audit + notify.
-- ============================================================

create or replace function public._unique_opp_slug(p_base text, p_opp uuid)
returns text language plpgsql set search_path = public as $$
declare s text := coalesce(public.slugify(p_base),'opportunity'); c text := s; i int := 2;
begin
  while exists (select 1 from public.opportunities where slug=c and deleted_at is null and (p_opp is null or id<>p_opp)) loop
    c := s||'-'||i; i := i+1; end loop;
  return c;
end $$;

-- ---------- CREATE / UPDATE draft ----------
create or replace function public.create_opportunity_draft(p_org uuid, p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_slug text; v_title text;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if not (public.is_org_editor(p_org) or public.has_admin_role('moderator')) then raise exception 'forbidden: org role required' using errcode='42501'; end if;
  v_title := coalesce(p_patch->>'title',''); if trim(v_title)='' then raise exception 'validation: назва обовʼязкова' using errcode='P0001'; end if;
  v_id := gen_random_uuid(); v_slug := public._unique_opp_slug(v_title, v_id);
  perform set_config('app.privileged_write','1',true);
  insert into public.opportunities(id, slug, title, org_id, created_by, business_status, moderation, status)
    values (v_id, v_slug, v_title, p_org, v_actor, 'draft', 'not_submitted', 'draft'::moderation_status);
  perform public._net_audit(v_actor,'opportunity_created','opportunity',v_id::text,null,jsonb_build_object('slug',v_slug),p_request_id);
  return jsonb_build_object('ok',true,'id',v_id,'slug',v_slug);
end $$;

create or replace function public.update_opportunity(p_id uuid, p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_ver int; v_bs opp_business_status;
begin
  if not (public.is_opp_editor(p_id) or public.has_admin_role('moderator')) then raise exception 'forbidden' using errcode='42501'; end if;
  select version, business_status into v_ver, v_bs from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_expected_version is not null and p_expected_version <> v_ver then raise exception 'version_conflict' using errcode='40001'; end if;
  if v_bs not in ('draft','paused') and not public.has_admin_role('moderator') then
    raise exception 'invalid_status_transition: редагувати можна лише draft/paused' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set
    title=coalesce(p_patch->>'title',title), short_desc=coalesce(p_patch->>'short_desc',short_desc), full_desc=coalesce(p_patch->>'full_desc',full_desc),
    opportunity_type_id=coalesce(nullif(p_patch->>'opportunity_type_id','')::uuid,opportunity_type_id),
    contact_user_id=coalesce(nullif(p_patch->>'contact_user_id','')::uuid,contact_user_id),
    country=coalesce(p_patch->>'country',country), region=coalesce(p_patch->>'region',region), city=coalesce(p_patch->>'city',city),
    remote_mode=coalesce((p_patch->>'remote_mode')::remote_mode,remote_mode),
    budget_vis=coalesce((p_patch->>'budget_vis')::opp_budget_visibility,budget_vis),
    budget_from=coalesce((p_patch->>'budget_from')::bigint,budget_from), budget_to=coalesce((p_patch->>'budget_to')::bigint,budget_to),
    currency=coalesce(p_patch->>'currency',currency), expected_format=coalesce(p_patch->>'expected_format',expected_format),
    application_method=coalesce(p_patch->>'application_method',application_method), external_application_url=coalesce(p_patch->>'external_application_url',external_application_url),
    application_deadline=coalesce((p_patch->>'application_deadline')::date,application_deadline),
    expiration_date=coalesce((p_patch->>'expiration_date')::date,expiration_date),
    sports=coalesce(public._jarr(p_patch,'sports'),sports), professional_categories=coalesce(public._jarr(p_patch,'professional_categories'),professional_categories),
    tags=coalesce(public._jarr(p_patch,'tags'),tags), updated_at=now()
  where id=p_id;
  perform public._net_audit(v_actor,'opportunity_updated','opportunity',p_id::text,jsonb_build_object('version',v_ver),jsonb_build_object('version',v_ver+1),p_request_id);
  return jsonb_build_object('ok',true,'id',p_id,'version',v_ver+1);
end $$;

-- ---------- validation helper ----------
create or replace function public._opp_validate(o public.opportunities) returns void language plpgsql set search_path = public as $$
begin
  if coalesce(trim(o.title),'')='' then raise exception 'validation: назва' using errcode='P0001'; end if;
  if o.opportunity_type_id is null then raise exception 'validation: тип' using errcode='P0001'; end if;
  if o.application_deadline is not null and o.expiration_date is not null and o.application_deadline > o.expiration_date then
    raise exception 'validation: дедлайн пізніше за expiration' using errcode='P0001'; end if;
  if o.expiration_date is not null and o.expiration_date < current_date then raise exception 'validation: expiration у минулому' using errcode='P0001'; end if;
  if o.budget_vis = 'public' then
    if o.budget_from is null and o.budget_to is null then raise exception 'validation: бюджет' using errcode='P0001'; end if;
    if coalesce(o.currency,'')='' then raise exception 'validation: валюта' using errcode='P0001'; end if;
    if o.budget_from is not null and o.budget_from < 0 then raise exception 'validation: budget_from<0' using errcode='P0001'; end if;
    if o.budget_from is not null and o.budget_to is not null and o.budget_from > o.budget_to then raise exception 'validation: from>to' using errcode='P0001'; end if;
  end if;
end $$;

-- ---------- SUBMIT / moderation ----------
create or replace function public.submit_opportunity_for_moderation(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); o public.opportunities;
begin
  if not (public.is_opp_editor(p_id) or public.has_admin_role('moderator')) then raise exception 'forbidden' using errcode='42501'; end if;
  select * into o from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if o.moderation not in ('not_submitted','changes_required') and o.business_status<>'draft' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform public._opp_validate(o);
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set moderation='pending' where id=p_id;
  perform public._net_audit(v_actor,'opportunity_submitted','opportunity',p_id::text,null,jsonb_build_object('moderation','pending'),p_request_id);
  return jsonb_build_object('ok',true,'moderation','pending');
end $$;

create or replace function public.approve_opportunity(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); o public.opportunities; v_slug text;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  select * into o from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if o.moderation not in ('pending','changes_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if not public.is_org_public(o.org_id) then raise exception 'validation: організація не схвалена' using errcode='P0001'; end if;
  perform public._opp_validate(o);
  v_slug := coalesce(o.slug, public._unique_opp_slug(o.title, p_id));
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set moderation='approved', business_status='active', slug=v_slug,
    published_at=coalesce(published_at, now()),
    expiration_date=coalesce(expiration_date, current_date + (select default_expiration_days from public.opportunity_types where id=o.opportunity_type_id)),
    moderation_reason=null where id=p_id;
  perform public._net_audit(v_actor,'opportunity_approved','opportunity',p_id::text,jsonb_build_object('moderation',o.moderation),jsonb_build_object('moderation','approved'),p_request_id);
  perform public._net_notify(o.created_by,'opportunity_approved','Можливість опубліковано','','opportunity',p_id::text);
  return jsonb_build_object('ok',true,'slug',v_slug,'business_status','active');
end $$;

create or replace function public.request_opportunity_changes(p_id uuid, p_reason text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_by uuid;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select created_by into v_by from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set moderation='changes_required', moderation_reason=p_reason where id=p_id;
  perform public._net_audit(v_actor,'opportunity_changes_requested','opportunity',p_id::text,null,jsonb_build_object('reason',p_reason),p_request_id);
  perform public._net_notify(v_by,'opportunity_changes_required','Потрібні зміни',p_reason,'opportunity',p_id::text);
  return jsonb_build_object('ok',true,'moderation','changes_required');
end $$;

create or replace function public.reject_opportunity(p_id uuid, p_reason text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_by uuid;
begin
  if not public.has_admin_role('moderator') then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select created_by into v_by from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set moderation='rejected', business_status='draft', moderation_reason=p_reason where id=p_id;
  perform public._net_notify(v_by,'opportunity_rejected','Можливість відхилено',p_reason,'opportunity',p_id::text);
  perform public._net_audit(v_actor,'opportunity_rejected','opportunity',p_id::text,null,jsonb_build_object('reason',p_reason),p_request_id);
  return jsonb_build_object('ok',true,'moderation','rejected');
end $$;

-- ---------- business transitions (pause/resume/close/extend) ----------
create or replace function public._opp_business(p_id uuid, p_to opp_business_status, p_actor uuid, p_admin_ok boolean, p_req text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_bs opp_business_status;
begin
  if not (public.is_opp_editor(p_id) or (p_admin_ok and public.has_admin_role('moderator'))) then raise exception 'forbidden' using errcode='42501'; end if;
  select business_status into v_bs from public.opportunities where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_to='paused' and v_bs<>'active' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if p_to='active' and v_bs<>'paused' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if p_to='closed' and v_bs not in ('active','paused') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set business_status=p_to,
    paused_at=case when p_to='paused' then now() else paused_at end,
    closed_at=case when p_to='closed' then now() else closed_at end
  where id=p_id;
  perform public._net_audit(p_actor,'opportunity_'||p_to::text,'opportunity',p_id::text,jsonb_build_object('business',v_bs),jsonb_build_object('business',p_to),p_req);
  return jsonb_build_object('ok',true,'business_status',p_to);
end $$;
create or replace function public.pause_opportunity(p_id uuid, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._opp_business(p_id,'paused',auth.uid(),true,p_request_id); $$;
create or replace function public.resume_opportunity(p_id uuid, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._opp_business(p_id,'active',auth.uid(),false,p_request_id); $$;
create or replace function public.close_opportunity(p_id uuid, p_request_id text default null) returns jsonb language sql security definer set search_path=public as $$ select public._opp_business(p_id,'closed',auth.uid(),true,p_request_id); $$;

create or replace function public.extend_opportunity_expiration(p_id uuid, p_new date, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not (public.is_opp_editor(p_id) or public.has_admin_role('moderator')) then raise exception 'forbidden' using errcode='42501'; end if;
  if p_new is null or p_new < current_date then raise exception 'validation: дата у минулому' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set expiration_date=p_new, business_status=case when business_status='expired' then 'active' else business_status end where id=p_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform public._net_audit(v_actor,'opportunity_deadline_extended','opportunity',p_id::text,null,jsonb_build_object('expiration',p_new),p_request_id);
  return jsonb_build_object('ok',true,'expiration_date',p_new);
end $$;

-- CRON: expire (ідемпотентно, лише service_role)
create or replace function public.expire_opportunities()
returns jsonb language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  perform set_config('app.privileged_write','1',true);
  with upd as (
    update public.opportunities set business_status='expired', expired_at=now()
    where business_status='active' and deleted_at is null and expiration_date is not null and expiration_date < current_date
    returning id) select count(*) into cnt from upd;
  return jsonb_build_object('ok',true,'expired',cnt);
end $$;

-- ============================================================
-- APPLICATIONS
-- ============================================================
create or replace function public.submit_opportunity_application(p_opp uuid, p_cover text default null, p_portfolio text default null, p_attachment uuid default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); o public.opportunities; v_id uuid; snap jsonb; v_author uuid;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into o from public.opportunities where id=p_opp and deleted_at is null for update;
  if not found or not public.is_opp_public(p_opp) then raise exception 'not_found' using errcode='P0002'; end if;
  if o.created_by = v_actor or public.is_org_editor(o.org_id) then raise exception 'validation: не можна відгукнутись на власну можливість' using errcode='P0001'; end if;
  if o.application_deadline is not null and o.application_deadline < current_date then raise exception 'validation: дедлайн минув' using errcode='P0001'; end if;
  if p_attachment is not null and not exists (select 1 from public.media_files where id=p_attachment and uploaded_by=v_actor) then
    raise exception 'forbidden: чужий attachment' using errcode='42501'; end if;
  select jsonb_build_object('display_name',coalesce(display_name,trim(first_name||' '||last_name)),'headline',headline,'city',city,'skills',skills,'verified',(verification_status='verified'))
    into snap from public.profiles where id=v_actor;
  begin
    insert into public.applications(opp_id,user_id,cover_message,portfolio_url,attachment_media_id,applicant_snapshot,status,submitted_at)
      values (p_opp,v_actor,p_cover,p_portfolio,p_attachment,snap,'new',now()) returning id into v_id;
  exception when unique_violation then raise exception 'duplicate application' using errcode='23505'; end;
  perform set_config('app.privileged_write','1',true);
  update public.opportunities set applications_count=applications_count+1 where id=p_opp;
  perform public._net_notify(o.created_by,'application_new','Новий відгук','','application',v_id::text);
  perform public._net_audit(v_actor,'application_submitted','application',v_id::text,null,jsonb_build_object('opp',p_opp),p_request_id);
  return jsonb_build_object('ok',true,'id',v_id,'status','new');
end $$;

create or replace function public.change_application_status(p_id uuid, p_to application_status, p_reason text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); a public.applications; v_from application_status; v_ok boolean;
begin
  select * into a from public.applications where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if not (public.is_opp_manager(a.opp_id) or public.is_admin()) then raise exception 'forbidden' using errcode='42501'; end if;
  v_from := a.status;
  v_ok := (v_from,p_to) in (
    ('new','viewed'),('viewed','shortlisted'),('viewed','rejected'),('shortlisted','contacted'),
    ('shortlisted','rejected'),('shortlisted','viewed'),('contacted','accepted'),('contacted','rejected'),('new','rejected'));
  if not v_ok then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.applications set status=p_to, viewed_at=case when p_to='viewed' and viewed_at is null then now() else viewed_at end where id=p_id;
  insert into public.application_status_history(application_id,from_status,to_status,changed_by,change_reason) values (p_id,v_from,p_to,v_actor,p_reason);
  perform public._net_notify(a.user_id,'application_'||p_to::text,'Статус відгуку',coalesce(p_reason,''),'application',p_id::text);
  perform public._net_audit(v_actor,'application_status_changed','application',p_id::text,jsonb_build_object('status',v_from),jsonb_build_object('status',p_to),p_request_id);
  return jsonb_build_object('ok',true,'status',p_to);
end $$;

create or replace function public.withdraw_application(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); a public.applications; v_author uuid;
begin
  select * into a from public.applications where id=p_id for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if a.user_id <> v_actor then raise exception 'forbidden' using errcode='42501'; end if;
  if a.status not in ('new','viewed','shortlisted','contacted') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.applications set status='withdrawn', withdrawn_at=now() where id=p_id;
  insert into public.application_status_history(application_id,from_status,to_status,changed_by) values (p_id,a.status,'withdrawn',v_actor);
  select created_by into v_author from public.opportunities where id=a.opp_id;
  perform public._net_notify(v_author,'application_withdrawn','Відгук відкликано','','application',p_id::text);
  return jsonb_build_object('ok',true,'status','withdrawn');
end $$;

create or replace function public.add_application_note(p_id uuid, p_body text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_org uuid;
begin
  select public.opp_org(opp_id) into v_org from public.applications where id=p_id;
  if v_org is null then raise exception 'not_found' using errcode='P0002'; end if;
  if not (public.is_org_manager(v_org) or public.is_admin()) then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.application_internal_notes(application_id,organization_id,author_user_id,body) values (p_id,v_org,v_actor,p_body);
  return jsonb_build_object('ok',true);
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'create_opportunity_draft(uuid,jsonb,text)','update_opportunity(uuid,jsonb,integer,text)',
    'submit_opportunity_for_moderation(uuid,text)','approve_opportunity(uuid,text)',
    'request_opportunity_changes(uuid,text,text)','reject_opportunity(uuid,text,text)',
    'pause_opportunity(uuid,text)','resume_opportunity(uuid,text)','close_opportunity(uuid,text)',
    'extend_opportunity_expiration(uuid,date,text)',
    'submit_opportunity_application(uuid,text,text,uuid,text)','change_application_status(uuid,application_status,text,text)',
    'withdraw_application(uuid,text)','add_application_note(uuid,text,text)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
revoke all on function public.expire_opportunities() from public, anon, authenticated;
grant execute on function public.expire_opportunities() to service_role;
