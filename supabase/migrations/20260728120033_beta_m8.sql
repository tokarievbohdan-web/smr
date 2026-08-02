-- ============================================================
-- 033 · Milestone 8 — Closed beta enablement
-- business_outcomes (підтверджені бізнес-результати) · survey_responses (in-product) ·
-- is_seed маркер (демо/seed-контент ≠ реальний запит) · beta_metrics/funnel RPC.
-- Жодного фейкового Opportunity/Event як реального — is_seed розділяє явно.
-- ============================================================

do $$ begin create type outcome_status as enum ('reported','verified','published','rejected'); exception when duplicate_object then null; end $$;

-- seed/demo маркер: у production не видаємо демо за реальний бізнес-запит
alter table public.opportunities add column if not exists is_seed boolean not null default false;
alter table public.events        add column if not exists is_seed boolean not null default false;

-- ---------- business outcomes (§45) ----------
create table if not exists public.business_outcomes (
  id uuid primary key default gen_random_uuid(),
  outcome_type text not null,                 -- contact_established|meeting_scheduled|proposal_requested|...
  source_module text,                         -- network|opportunities|introductions|events|articles
  participants uuid[] default '{}',           -- profile ids
  organizations uuid[] default '{}',          -- org ids
  outcome_date date,
  status outcome_status not null default 'reported',
  short_description text,
  verification_source text,
  permission_for_public_use boolean not null default false,
  reported_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_outcomes_type on public.business_outcomes (outcome_type);
create index if not exists idx_outcomes_module on public.business_outcomes (source_module);
create index if not exists idx_outcomes_status on public.business_outcomes (status);

-- ---------- in-product surveys (§33) ----------
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  context text not null,                      -- onboarding|search|application|introduction|event
  question_key text,
  rating int,                                 -- 1..5 або null
  answer text,                                -- yes|no|free text
  entity_type text, entity_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_survey_context on public.survey_responses (context, created_at desc);

do $$ begin create trigger t_outcomes_touch before update on public.business_outcomes for each row execute function public.touch_updated_at(); exception when duplicate_object then null; end $$;

-- ---------- RLS ----------
alter table public.business_outcomes enable row level security;
alter table public.survey_responses  enable row level security;

-- outcomes: керує команда (moderator+); учасник бачить свій підтверджений результат
drop policy if exists "bo: admin" on public.business_outcomes;
create policy "bo: admin" on public.business_outcomes for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "bo: participant read" on public.business_outcomes;
create policy "bo: participant read" on public.business_outcomes for select using (public.is_admin() or auth.uid() = any(participants));

-- surveys: власник створює; читають лише адміни (агрегати)
drop policy if exists "sr: own insert" on public.survey_responses;
create policy "sr: own insert" on public.survey_responses for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "sr: admin read" on public.survey_responses;
create policy "sr: admin read" on public.survey_responses for select using (public.is_admin() or user_id = auth.uid());

-- ============================================================
-- RPC
-- ============================================================
create or replace function public.record_business_outcome(p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if coalesce(trim(p_patch->>'outcome_type'),'')='' then raise exception 'validation: outcome_type' using errcode='P0001'; end if;
  insert into public.business_outcomes(outcome_type,source_module,participants,organizations,outcome_date,status,short_description,verification_source,permission_for_public_use,reported_by)
    values (p_patch->>'outcome_type', p_patch->>'source_module',
      coalesce((select array(select jsonb_array_elements_text(p_patch->'participants'))::uuid[]),'{}'),
      coalesce((select array(select jsonb_array_elements_text(p_patch->'organizations'))::uuid[]),'{}'),
      (p_patch->>'outcome_date')::date, coalesce((p_patch->>'status')::outcome_status,'reported'),
      p_patch->>'short_description', p_patch->>'verification_source',
      coalesce((p_patch->>'permission_for_public_use')::boolean,false), v_actor)
    returning id into v_id;
  perform public._net_audit(v_actor,'business_outcome_recorded','business_outcome',v_id::text,null,jsonb_build_object('type',p_patch->>'outcome_type'),null);
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

create or replace function public.update_business_outcome(p_id uuid, p_status text default null, p_permission boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update public.business_outcomes set
    status = coalesce(nullif(p_status,'')::outcome_status, status),
    permission_for_public_use = coalesce(p_permission, permission_for_public_use)
    where id = p_id;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.submit_survey_response(p_context text, p_question text default null, p_rating int default null, p_answer text default null, p_entity_type text default null, p_entity_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'forbidden' using errcode='42501'; end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then raise exception 'validation: rating 1..5' using errcode='P0001'; end if;
  insert into public.survey_responses(user_id,context,question_key,rating,answer,entity_type,entity_id)
    values (v_actor,p_context,p_question,p_rating,left(coalesce(p_answer,''),2000),p_entity_type,p_entity_id);
  return jsonb_build_object('ok',true);
end $$;

-- beta funnel + outcome метрики (аналітик+). Активація = onboarding done + профіль + ≥2 дії.
create or replace function public.beta_metrics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_admin_role('analyst') or public.has_admin_role('super_admin')) then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'invitations_total', (select count(*) from public.beta_invitations),
    'invitations_accepted', (select count(*) from public.beta_invitations where accepted_at is not null),
    'cohorts', (select coalesce(jsonb_object_agg(c, n),'{}'::jsonb) from (
        select unnest(cohorts) c, count(*) n from public.profiles where deleted_at is null and array_length(cohorts,1) is not null group by 1) t),
    'profiles_completed', (select count(*) from public.profiles where deleted_at is null
        and coalesce(trim(display_name),'')<>'' and coalesce(trim(headline),'')<>'' and coalesce(trim(city),'')<>''),
    'funnel_opportunities', jsonb_build_object(
        'published', (select count(*) from public.opportunities where business_status='active' and moderation='approved' and is_seed=false and deleted_at is null),
        'applications', (select count(*) from public.applications where deleted_at is null),
        'contacted', (select count(*) from public.applications where status='contacted' and deleted_at is null),
        'accepted', (select count(*) from public.applications where status='accepted' and deleted_at is null)),
    'funnel_introductions', jsonb_build_object(
        'submitted', (select count(*) from public.introductions where status <> 'draft' and deleted_at is null),
        'sent', (select count(*) from public.introductions where introduction_sent_at is not null),
        'closed', (select count(*) from public.introductions where status='closed')),
    'funnel_events', jsonb_build_object(
        'published', (select count(*) from public.events where business_status in ('published','postponed','completed') and is_seed=false and deleted_at is null),
        'registrations', (select count(*) from public.event_registrations where status in ('registered','attended')),
        'attended', (select count(*) from public.event_registrations where status='attended')),
    'business_outcomes_total', (select count(*) from public.business_outcomes where status in ('verified','published')),
    'outcomes_by_type', (select coalesce(jsonb_object_agg(outcome_type, n),'{}'::jsonb) from (
        select outcome_type, count(*) n from public.business_outcomes where status in ('verified','published') group by 1) t),
    'survey_avg_ratings', (select coalesce(jsonb_object_agg(context, round(avg,2)),'{}'::jsonb) from (
        select context, avg(rating)::numeric avg from public.survey_responses where rating is not null group by 1) t),
    'generated_at', now()
  );
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'record_business_outcome(jsonb)','update_business_outcome(uuid,text,boolean)',
    'submit_survey_response(text,text,integer,text,text,text)','beta_metrics()'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
