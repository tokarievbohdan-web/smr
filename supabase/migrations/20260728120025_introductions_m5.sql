-- ============================================================
-- 025 · Milestone 5 — Introductions: схема (розширює introductions з 008)
-- Ручний PM-workflow: new→under_review→(information_required|waiting_for_target_
-- consent→target_accepted/declined)→approved→introduction_prepared→introduction_sent
-- →follow_up_due→closed / declined / cancelled. Контакти — лише після згоди.
-- ============================================================

-- ---------- enums ----------
do $$ begin create type introduction_status as enum
  ('draft','new','under_review','information_required','waiting_for_target_consent',
   'target_accepted','target_declined','approved','introduction_prepared','introduction_sent',
   'follow_up_due','closed','declined','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type target_consent_status as enum
  ('not_required','pending','accepted','declined','more_information_requested','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type intro_priority as enum ('low','normal','high','urgent'); exception when duplicate_object then null; end $$;

-- ---------- introduction types (довідник) ----------
create table if not exists public.introduction_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title_uk text not null, active boolean not null default true,
  sort_order int not null default 0, requires_value_for_target boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- introductions: нові колонки ----------
alter table public.introductions add column if not exists requester_organization_id uuid references public.organizations(id) on delete set null;
alter table public.introductions add column if not exists target_profile_id uuid references public.profiles(id) on delete set null;
alter table public.introductions add column if not exists target_organization_id uuid references public.organizations(id) on delete set null;
alter table public.introductions add column if not exists target_user_id uuid references public.profiles(id) on delete set null; -- конкретний одержувач (для consent)
alter table public.introductions add column if not exists request_type_id uuid references public.introduction_types(id) on delete set null;
alter table public.introductions add column if not exists subject text;
alter table public.introductions add column if not exists expected_outcome text;
alter table public.introductions add column if not exists value_for_target text;
alter table public.introductions add column if not exists related_entity_type text;
alter table public.introductions add column if not exists related_entity_id uuid;
alter table public.introductions add column if not exists consent_to_share_contacts boolean not null default false;
alter table public.introductions add column if not exists requester_shared_contacts jsonb default '{}'::jsonb;  -- {email:bool,phone:bool}
alter table public.introductions add column if not exists target_consent_status target_consent_status not null default 'not_required';
alter table public.introductions add column if not exists target_response_message text;
alter table public.introductions add column if not exists target_responded_at timestamptz;
alter table public.introductions add column if not exists target_shared_contacts jsonb default '{}'::jsonb;
alter table public.introductions add column if not exists public_feedback text;
alter table public.introductions add column if not exists internal_resolution text;
alter table public.introductions add column if not exists public_reason text;   -- для requester (decline)
alter table public.introductions add column if not exists internal_reason text; -- лише admin
alter table public.introductions add column if not exists intro_message text;   -- підготовлений текст знайомства
alter table public.introductions add column if not exists priority2 intro_priority not null default 'normal';
alter table public.introductions add column if not exists assigned_at timestamptz;
alter table public.introductions add column if not exists approved_at timestamptz;
alter table public.introductions add column if not exists approved_by uuid references public.profiles(id) on delete set null;
alter table public.introductions add column if not exists introduction_sent_at timestamptz;
alter table public.introductions add column if not exists closed_at timestamptz;
alter table public.introductions add column if not exists declined_at timestamptz;
alter table public.introductions add column if not exists cancelled_at timestamptz;
alter table public.introductions add column if not exists follow_up_due_at timestamptz;
alter table public.introductions add column if not exists version int not null default 1;

-- status intro_status → introduction_status (таблиця порожня в prod)
do $$ begin
  if (select udt_name from information_schema.columns where table_schema='public' and table_name='introductions' and column_name='status')='intro_status' then
    alter table public.introductions alter column status drop default;
    alter table public.introductions alter column status set data type introduction_status using (
      case status::text when 'review' then 'under_review' when 'moreinfo' then 'information_required'
        when 'approved' then 'approved' when 'sent' then 'introduction_sent' when 'declined' then 'declined'
        when 'closed' then 'closed' else 'new' end::introduction_status);
    alter table public.introductions alter column status set default 'new'::introduction_status;
  end if;
end $$;

-- ---------- допоміжні таблиці ----------
create table if not exists public.introduction_status_history (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  from_status introduction_status, to_status introduction_status not null,
  changed_by uuid references public.profiles(id) on delete set null, actor_role text,
  public_note text, created_at timestamptz not null default now()
);
create table if not exists public.introduction_internal_notes (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  author_admin_id uuid references public.profiles(id) on delete set null, body text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.introduction_messages (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  kind text not null default 'introduction_email', provider text, recipient_list jsonb default '[]'::jsonb,
  subject text, body text, template_version text, message_id text,
  delivery_status text not null default 'pending', failure_reason text, retry_count int not null default 0,
  sent_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.introduction_follow_ups (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  due_at timestamptz not null, status text not null default 'pending', created_at timestamptz not null default now()
);
create table if not exists public.introduction_outcomes (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  party_user_id uuid references public.profiles(id) on delete set null,
  outcome_status text, comment text, next_step text, created_at timestamptz not null default now(),
  unique (introduction_id, party_user_id)
);
-- одноразові consent-токени (додатковий безпечний механізм; основний шлях — авторизований target)
create table if not exists public.introduction_consent_tokens (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid references public.introductions(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  token_hash text not null unique, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now()
);

-- ---------- anti-dup: один активний запит requester→target за типом ----------
create unique index if not exists uq_intro_active on public.introductions (requester_id, coalesce(target_profile_id, target_organization_id), request_type_id)
  where status in ('new','under_review','information_required','waiting_for_target_consent','target_accepted','approved','introduction_prepared')
    and deleted_at is null and request_type_id is not null;

-- ---------- indexes ----------
create index if not exists idx_intros_status2 on public.introductions (status) where deleted_at is null;
create index if not exists idx_intros_manager2 on public.introductions (manager_id);
create index if not exists idx_intros_targetu on public.introductions (target_user_id);
create index if not exists idx_intros_targetp on public.introductions (target_profile_id);
create index if not exists idx_intros_targeto on public.introductions (target_organization_id);
create index if not exists idx_intros_followup on public.introductions (follow_up_due_at) where status = 'follow_up_due';
create index if not exists idx_ish_intro on public.introduction_status_history (introduction_id);
create index if not exists idx_iin_intro on public.introduction_internal_notes (introduction_id);
