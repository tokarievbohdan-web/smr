-- ============================================================
-- 027 · Milestone 5 — Introductions: атомарні RPC (SECURITY DEFINER)
-- ============================================================

create or replace function public._intro_hist(p_id uuid, p_from introduction_status, p_to introduction_status, p_actor uuid, p_role text, p_note text default null)
returns void language sql set search_path = public as $$
  insert into public.introduction_status_history(introduction_id, from_status, to_status, changed_by, actor_role, public_note)
  values (p_id, p_from, p_to, p_actor, p_role, p_note);
$$;

-- ---------- REQUESTER ----------
create or replace function public.create_introduction_draft(p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_tp uuid := nullif(p_patch->>'target_profile_id','')::uuid; v_to uuid := nullif(p_patch->>'target_organization_id','')::uuid;
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if v_tp is null and v_to is null then raise exception 'validation: target обовʼязковий' using errcode='P0001'; end if;
  if v_tp = v_actor then raise exception 'validation: не можна знайомитись із собою' using errcode='P0001'; end if;
  if v_tp is not null and exists (select 1 from public.profiles where id=v_tp and (deleted_at is not null or status='blocked')) then raise exception 'validation: target недоступний' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  v_id := gen_random_uuid();
  insert into public.introductions(id, requester_id, requester_organization_id, target_type, target_profile_id, target_organization_id, target_user_id,
      request_type_id, subject, reason, context, expected_outcome, value_for_target, related_entity_type, related_entity_id,
      consent, consent_to_share_contacts, requester_shared_contacts, status)
  values (v_id, v_actor, nullif(p_patch->>'requester_organization_id','')::uuid,
      case when v_tp is not null then 'profile' else 'organization' end, v_tp, v_to, v_tp,
      nullif(p_patch->>'request_type_id','')::uuid, p_patch->>'subject', p_patch->>'reason', p_patch->>'context',
      p_patch->>'expected_outcome', p_patch->>'value_for_target', p_patch->>'related_entity_type', nullif(p_patch->>'related_entity_id','')::uuid,
      coalesce((p_patch->>'consent_to_share_contacts')::boolean,false), coalesce((p_patch->>'consent_to_share_contacts')::boolean,false),
      coalesce(p_patch->'requester_shared_contacts','{}'::jsonb), 'draft');
  perform public._net_audit(v_actor,'introduction_drafted','introduction',v_id::text,null,null,p_request_id);
  return jsonb_build_object('ok',true,'id',v_id,'status','draft');
end $$;

create or replace function public.update_introduction_draft(p_id uuid, p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_ver int; v_status introduction_status;
begin
  select version, status into v_ver, v_status from public.introductions where id=p_id and requester_id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_status not in ('draft','information_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if p_expected_version is not null and p_expected_version <> v_ver then raise exception 'version_conflict' using errcode='40001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set
    subject=coalesce(p_patch->>'subject',subject), reason=coalesce(p_patch->>'reason',reason), context=coalesce(p_patch->>'context',context),
    expected_outcome=coalesce(p_patch->>'expected_outcome',expected_outcome), value_for_target=coalesce(p_patch->>'value_for_target',value_for_target),
    request_type_id=coalesce(nullif(p_patch->>'request_type_id','')::uuid,request_type_id),
    consent_to_share_contacts=coalesce((p_patch->>'consent_to_share_contacts')::boolean,consent_to_share_contacts),
    requester_shared_contacts=coalesce(p_patch->'requester_shared_contacts',requester_shared_contacts), updated_at=now()
  where id=p_id;
  return jsonb_build_object('ok',true,'version',v_ver+1);
end $$;

create or replace function public.submit_introduction_request(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions; v_reqval boolean;
begin
  select * into i from public.introductions where id=p_id and requester_id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if i.status not in ('draft','information_required') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if coalesce(trim(i.subject),'')='' or coalesce(trim(i.context),'')='' or coalesce(trim(i.expected_outcome),'')='' then raise exception 'validation: заповніть тему/контекст/результат' using errcode='P0001'; end if;
  if i.request_type_id is null then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select requires_value_for_target into v_reqval from public.introduction_types where id=i.request_type_id;
  if v_reqval and coalesce(trim(i.value_for_target),'')='' then raise exception 'validation: вкажіть цінність для другої сторони' using errcode='P0001'; end if;
  if not i.consent_to_share_contacts then raise exception 'validation: потрібна згода на передачу контактів' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  begin
    update public.introductions set status='new', updated_at=now() where id=p_id;
  exception when unique_violation then raise exception 'duplicate active request' using errcode='23505'; end;
  perform public._intro_hist(p_id,i.status,'new',v_actor,'requester');
  perform public._net_audit(v_actor,'introduction_submitted','introduction',p_id::text,null,null,p_request_id);
  return jsonb_build_object('ok',true,'status','new');
end $$;

create or replace function public.cancel_introduction_request(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_status introduction_status;
begin
  select status into v_status from public.introductions where id=p_id and requester_id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_status not in ('draft','new','under_review','information_required','waiting_for_target_consent') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='cancelled', cancelled_at=now() where id=p_id;
  perform public._intro_hist(p_id,v_status,'cancelled',v_actor,'requester');
  return jsonb_build_object('ok',true,'status','cancelled');
end $$;

create or replace function public.submit_introduction_information(p_id uuid, p_response text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_status introduction_status; v_by uuid;
begin
  select status, manager_id into v_status, v_by from public.introductions where id=p_id and requester_id=v_actor and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_status <> 'information_required' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set info_response=p_response, status='under_review', updated_at=now() where id=p_id;
  perform public._intro_hist(p_id,'information_required','under_review',v_actor,'requester','Надано інформацію');
  return jsonb_build_object('ok',true,'status','under_review');
end $$;

-- ---------- PARTNERSHIP MANAGER ----------
create or replace function public.assign_introduction_manager(p_id uuid, p_manager uuid default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_status introduction_status; v_mgr uuid;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  v_mgr := coalesce(p_manager, v_actor);
  perform set_config('app.privileged_write','1',true);
  update public.introductions set manager_id=v_mgr, assigned_at=now(), status=case when status='new' then 'under_review' else status end where id=p_id;
  perform public._intro_hist(p_id,v_status,(select status from public.introductions where id=p_id),v_actor,'partnership_manager','Призначено менеджера');
  return jsonb_build_object('ok',true,'manager_id',v_mgr);
end $$;

create or replace function public.request_introduction_information(p_id uuid, p_question text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='information_required', info_request=p_question where id=p_id;
  perform public._intro_hist(p_id,i.status,'information_required',v_actor,'partnership_manager','Запит інформації');
  perform public._net_notify(i.requester_id,'introduction_information_required','Потрібна інформація',p_question,'introduction',p_id::text);
  return jsonb_build_object('ok',true,'status','information_required');
end $$;

create or replace function public.request_target_consent(p_id uuid, p_target_user uuid default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions; v_tu uuid;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  v_tu := coalesce(p_target_user, i.target_user_id, i.target_profile_id);
  if v_tu is null then raise exception 'validation: не визначено одержувача згоди' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='waiting_for_target_consent', target_consent_status='pending', target_user_id=v_tu where id=p_id;
  perform public._intro_hist(p_id,i.status,'waiting_for_target_consent',v_actor,'partnership_manager','Запит згоди в другої сторони');
  perform public._net_notify(v_tu,'introduction_consent_request','Запит на знайомство', coalesce(i.subject,''),'introduction',p_id::text);
  return jsonb_build_object('ok',true,'status','waiting_for_target_consent');
end $$;

create or replace function public.respond_target_consent(p_id uuid, p_accept boolean, p_message text default null, p_shared jsonb default '{}'::jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions; v_to introduction_status;
begin
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if i.target_user_id <> v_actor then raise exception 'forbidden: не адресовано вам' using errcode='42501'; end if;
  if i.status <> 'waiting_for_target_consent' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  v_to := case when p_accept then 'target_accepted' else 'target_declined' end;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status=v_to, target_consent_status=(case when p_accept then 'accepted' else 'declined' end)::target_consent_status,
    target_response_message=p_message, target_responded_at=now(), target_shared_contacts=coalesce(p_shared,'{}'::jsonb) where id=p_id;
  perform public._intro_hist(p_id,'waiting_for_target_consent',v_to,v_actor,'target');
  perform public._net_notify(i.requester_id, case when p_accept then 'introduction_target_accepted' else 'introduction_target_declined' end,
    case when p_accept then 'Другу сторону погоджено' else 'Знайомство відхилено' end,'','introduction',p_id::text);
  return jsonb_build_object('ok',true,'status',v_to);
end $$;

create or replace function public.approve_introduction_request(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if i.status not in ('target_accepted','under_review') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='approved', approved_at=now(), approved_by=v_actor where id=p_id;
  perform public._intro_hist(p_id,i.status,'approved',v_actor,'partnership_manager');
  perform public._net_notify(i.requester_id,'introduction_approved','Знайомство схвалено','','introduction',p_id::text);
  return jsonb_build_object('ok',true,'status','approved');
end $$;

create or replace function public.decline_introduction_request(p_id uuid, p_public_reason text, p_internal_reason text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_public_reason),'')='' then raise exception 'validation: причина обовʼязкова' using errcode='P0001'; end if;
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='declined', declined_at=now(), public_reason=p_public_reason, internal_reason=p_internal_reason where id=p_id;
  perform public._intro_hist(p_id,i.status,'declined',v_actor,'partnership_manager',p_public_reason);
  perform public._net_notify(i.requester_id,'introduction_declined','Запит відхилено',p_public_reason,'introduction',p_id::text);
  return jsonb_build_object('ok',true,'status','declined');
end $$;

create or replace function public.prepare_introduction(p_id uuid, p_message text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_status introduction_status;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if v_status not in ('approved','introduction_prepared') then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='introduction_prepared', intro_message=p_message where id=p_id;
  perform public._intro_hist(p_id,v_status,'introduction_prepared',v_actor,'partnership_manager');
  return jsonb_build_object('ok',true,'status','introduction_prepared');
end $$;

-- SEND: ідемпотентно; email-метадані у introduction_messages (реальна відправка — шар API/провайдер)
create or replace function public.send_introduction(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into i from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if i.status = 'introduction_sent' then return jsonb_build_object('ok',true,'status','introduction_sent','already',true); end if;
  if i.status <> 'introduction_prepared' then raise exception 'invalid_status_transition' using errcode='P0001'; end if;
  if coalesce(trim(i.intro_message),'')='' then raise exception 'validation: немає тексту знайомства' using errcode='P0001'; end if;
  perform set_config('app.privileged_write','1',true);
  insert into public.introduction_messages(introduction_id, kind, recipient_list, subject, body, delivery_status)
    values (p_id,'introduction_email', jsonb_build_array(i.requester_id, i.target_user_id), coalesce(i.subject,'Знайомство SMR'), i.intro_message, 'pending');
  update public.introductions set status='introduction_sent', introduction_sent_at=now(), follow_up_due_at=now()+interval '7 days' where id=p_id;
  perform public._intro_hist(p_id,'introduction_prepared','introduction_sent',v_actor,'partnership_manager');
  insert into public.introduction_follow_ups(introduction_id, due_at) values (p_id, now()+interval '7 days');
  perform public._net_notify(i.requester_id,'introduction_sent','Знайомство надіслано','','introduction',p_id::text);
  perform public._net_notify(i.target_user_id,'introduction_sent','Вас представлено','','introduction',p_id::text);
  perform public._net_audit(v_actor,'introduction_sent','introduction',p_id::text,null,jsonb_build_object('contacts_disclosed',true),p_request_id);
  return jsonb_build_object('ok',true,'status','introduction_sent');
end $$;

-- Розкриття контактів іншої сторони — лише після introduction_sent і лише сторонам.
create or replace function public.get_introduction_contacts(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); i public.introductions; v_other uuid; v_flags jsonb; em text; ph text;
begin
  select * into i from public.introductions where id=p_id and deleted_at is null;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if i.status <> 'introduction_sent' then raise exception 'forbidden: контакти ще не розкрито' using errcode='42501'; end if;
  if v_actor = i.requester_id then v_other := i.target_user_id; v_flags := i.target_shared_contacts;
  elsif v_actor = i.target_user_id then v_other := i.requester_id; v_flags := i.requester_shared_contacts;
  else raise exception 'forbidden' using errcode='42501'; end if;
  select public_email, public_phone into em, ph from public.profiles where id=v_other;
  return jsonb_build_object(
    'email', case when coalesce((v_flags->>'email')::boolean,false) then em else null end,
    'phone', case when coalesce((v_flags->>'phone')::boolean,false) then ph else null end);
end $$;

create or replace function public.submit_introduction_feedback(p_id uuid, p_outcome text, p_comment text default null, p_next text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not public.intro_is_party(p_id) then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.introduction_outcomes(introduction_id, party_user_id, outcome_status, comment, next_step)
    values (p_id, v_actor, p_outcome, p_comment, p_next)
    on conflict (introduction_id, party_user_id) do update set outcome_status=excluded.outcome_status, comment=excluded.comment, next_step=excluded.next_step;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.close_introduction_request(p_id uuid, p_resolution text default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_status introduction_status;
begin
  if not public.is_pm() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from public.introductions where id=p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  perform set_config('app.privileged_write','1',true);
  update public.introductions set status='closed', closed_at=now(), internal_resolution=p_resolution where id=p_id;
  perform public._intro_hist(p_id,v_status,'closed',v_actor,'partnership_manager');
  return jsonb_build_object('ok',true,'status','closed');
end $$;

-- CRON: прострочені consent → expired; introduction_sent із follow_up_due_at<=now → follow_up_due
create or replace function public.introductions_cron()
returns jsonb language plpgsql security definer set search_path = public as $$
declare c1 int; c2 int;
begin
  perform set_config('app.privileged_write','1',true);
  with u as (update public.introductions set target_consent_status='expired', status='under_review'
    where status='waiting_for_target_consent' and target_responded_at is null and updated_at < now()-interval '7 days' returning id) select count(*) into c1 from u;
  with u2 as (update public.introductions set status='follow_up_due'
    where status='introduction_sent' and follow_up_due_at is not null and follow_up_due_at <= now() returning id) select count(*) into c2 from u2;
  return jsonb_build_object('ok',true,'consent_expired',c1,'follow_up_due',c2);
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'create_introduction_draft(jsonb,text)','update_introduction_draft(uuid,jsonb,integer,text)',
    'submit_introduction_request(uuid,text)','cancel_introduction_request(uuid,text)','submit_introduction_information(uuid,text,text)',
    'assign_introduction_manager(uuid,uuid,text)','request_introduction_information(uuid,text,text)',
    'request_target_consent(uuid,uuid,text)','respond_target_consent(uuid,boolean,text,jsonb,text)',
    'approve_introduction_request(uuid,text)','decline_introduction_request(uuid,text,text,text)',
    'prepare_introduction(uuid,text,text)','send_introduction(uuid,text)','get_introduction_contacts(uuid)',
    'submit_introduction_feedback(uuid,text,text,text,text)','close_introduction_request(uuid,text,text)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
revoke all on function public.introductions_cron() from public, anon, authenticated;
grant execute on function public.introductions_cron() to service_role;
