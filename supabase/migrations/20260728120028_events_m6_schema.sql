-- ============================================================
-- 028 · Milestone 6 — Events / Registrations / Waitlist: схема
-- Розширює events/event_registrations (007). Prod events — baseline-порожня.
-- Розділяємо moderation ↔ business lifecycle. Час — timestamptz + timezone.
-- Лічильники (registered_count/waitlist_count) денормалізовані, ведуться
-- лише всередині атомарних RPC під row-lock (жодних client counters).
-- ============================================================

-- ---------- enums ----------
do $$ begin create type event_moderation_status as enum ('not_submitted','pending','changes_required','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type event_business_status as enum ('draft','scheduled','published','postponed','cancelled','completed','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type event_format as enum ('offline','online','hybrid','deadline_only'); exception when duplicate_object then null; end $$;
do $$ begin create type event_ticket_type as enum ('free','paid_external','invitation_only','not_applicable'); exception when duplicate_object then null; end $$;
do $$ begin create type event_registration_mode as enum ('instant','approval_required','external','disabled'); exception when duplicate_object then null; end $$;
do $$ begin create type event_reg_status as enum ('pending','registered','waitlisted','rejected','cancelled','attended','no_show','invited'); exception when duplicate_object then null; end $$;
do $$ begin create type waitlist_promo_status as enum ('not_offered','offered','accepted','declined','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type participant_list_visibility as enum ('hidden','registered_only','public_names','public_profiles'); exception when duplicate_object then null; end $$;
do $$ begin create type event_partner_type as enum ('organizer','co_organizer','general_partner','media_partner','supporting_partner','venue_partner','other'); exception when duplicate_object then null; end $$;

-- ---------- event types (керований довідник) ----------
create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title_uk text not null, description_uk text,
  active boolean not null default true, sort_order int not null default 0,
  supports_registration boolean not null default true,
  default_duration_minutes int not null default 120,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------- events: нові колонки (типізований M6-шар поверх baseline 007) ----------
alter table public.events add column if not exists slug text;
alter table public.events add column if not exists event_type_id uuid references public.event_types(id) on delete set null;
alter table public.events add column if not exists format_kind event_format not null default 'offline';
alter table public.events add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists primary_contact_user_id uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists cover_media_id uuid references public.media_files(id) on delete set null;
alter table public.events add column if not exists country text;
alter table public.events add column if not exists region text;
alter table public.events add column if not exists venue_name text;
alter table public.events add column if not exists address text;
alter table public.events add column if not exists map_url text;
alter table public.events add column if not exists online_platform text;
alter table public.events add column if not exists online_public_url text;
alter table public.events add column if not exists online_private_url text;
alter table public.events add column if not exists starts_at timestamptz;
alter table public.events add column if not exists ends_at timestamptz;
alter table public.events add column if not exists registration_opens_at timestamptz;
alter table public.events add column if not exists registration_deadline_at timestamptz;
alter table public.events add column if not exists capacity int;
alter table public.events add column if not exists waitlist_enabled boolean not null default false;
alter table public.events add column if not exists participant_list_vis participant_list_visibility not null default 'hidden';
alter table public.events add column if not exists ticket_type event_ticket_type not null default 'free';
alter table public.events add column if not exists ticket_price numeric(12,2);
alter table public.events add column if not exists currency text;
alter table public.events add column if not exists external_ticket_url text;
alter table public.events add column if not exists registration_mode event_registration_mode not null default 'instant';
alter table public.events add column if not exists approval_required boolean not null default false;
alter table public.events add column if not exists business_status event_business_status not null default 'draft';
alter table public.events add column if not exists moderation event_moderation_status not null default 'not_submitted';
alter table public.events add column if not exists moderation_reason text;
alter table public.events add column if not exists content_version int not null default 1;
alter table public.events add column if not exists registered_count int not null default 0;
alter table public.events add column if not exists waitlist_count int not null default 0;
alter table public.events add column if not exists public_cancel_reason text;
alter table public.events add column if not exists internal_cancel_note text;
alter table public.events add column if not exists published_at timestamptz;
alter table public.events add column if not exists scheduled_publish_at timestamptz;
alter table public.events add column if not exists cancelled_at timestamptz;
alter table public.events add column if not exists postponed_at timestamptz;
alter table public.events add column if not exists completed_at timestamptz;
alter table public.events add column if not exists archived_at timestamptz;
alter table public.events add column if not exists version int not null default 1;
create unique index if not exists uq_events_slug on public.events (slug) where deleted_at is null;

-- ---------- speakers ----------
create table if not exists public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null, headline text, organization_name text,
  avatar_media_id uuid references public.media_files(id) on delete set null,
  bio text, sort_order int not null default 0, is_public boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------- partners ----------
create table if not exists public.event_partners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null, logo_media_id uuid references public.media_files(id) on delete set null,
  partner_type event_partner_type not null default 'other', external_url text,
  sort_order int not null default 0, created_at timestamptz not null default now()
);

-- ---------- tags ----------
create table if not exists public.event_tags (
  id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, active boolean not null default true
);
create table if not exists public.event_tag_links (
  event_id uuid references public.events(id) on delete cascade,
  tag_id uuid references public.event_tags(id) on delete cascade,
  primary key (event_id, tag_id)
);

-- ---------- schedule ----------
create table if not exists public.event_schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null, description text,
  starts_at timestamptz, ends_at timestamptz,
  speaker_ids uuid[] default '{}', location_label text, sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

-- ---------- registrations: розширення ----------
-- Конвертуємо status registration_status(007) → event_reg_status (prod порожня).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='event_registrations'
               and column_name='status' and udt_name='registration_status') then
    alter table public.event_registrations alter column status drop default;
    alter table public.event_registrations alter column status type event_reg_status
      using (case status::text when 'waitlist' then 'waitlisted' when 'noshow' then 'no_show' else status::text end)::event_reg_status;
    alter table public.event_registrations alter column status set default 'registered';
  end if;
end $$;
alter table public.event_registrations add column if not exists registration_source text;
alter table public.event_registrations add column if not exists answers jsonb;
alter table public.event_registrations add column if not exists consent_to_share_profile boolean not null default false;
alter table public.event_registrations add column if not exists consent_to_participant_list boolean not null default false;
alter table public.event_registrations add column if not exists registered_at timestamptz not null default now();
alter table public.event_registrations add column if not exists approved_at timestamptz;
alter table public.event_registrations add column if not exists rejected_at timestamptz;
alter table public.event_registrations add column if not exists cancelled_at timestamptz;
alter table public.event_registrations add column if not exists waitlisted_at timestamptz;
alter table public.event_registrations add column if not exists promoted_at timestamptz;
alter table public.event_registrations add column if not exists checked_in_at timestamptz;
alter table public.event_registrations add column if not exists checked_in_by uuid references public.profiles(id) on delete set null;
alter table public.event_registrations add column if not exists check_in_token text;
alter table public.event_registrations add column if not exists promotion_status waitlist_promo_status not null default 'not_offered';
alter table public.event_registrations add column if not exists promotion_offered_at timestamptz;
alter table public.event_registrations add column if not exists promotion_expires_at timestamptz;
alter table public.event_registrations add column if not exists waitlist_seq bigint;   -- FIFO-порядок у черзі
alter table public.event_registrations add column if not exists updated_at timestamptz not null default now();
alter table public.event_registrations add column if not exists version int not null default 1;

do $$ begin
  create trigger t_event_regs_touch before update on public.event_registrations for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_event_speakers_touch before update on public.event_speakers for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ---------- registration status history ----------
create table if not exists public.event_registration_status_history (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.event_registrations(id) on delete cascade,
  from_status event_reg_status, to_status event_reg_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_reason text, created_at timestamptz not null default now()
);

-- ---------- attendance (окрема нормалізована таблиця + денорм у registrations) ----------
create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  state text not null default 'unknown',            -- attended|no_show|unknown
  marked_by uuid references public.profiles(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (registration_id)
);

-- ---------- internal notes / reminders / messages / reschedule history ----------
create table if not exists public.event_internal_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  author_user_id uuid references public.profiles(id) on delete set null,
  body text not null, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  kind text not null,                               -- registration|d7|d1|h1|location_changed|link_changed
  scheduled_for timestamptz, sent_at timestamptz, status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create table if not exists public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete set null,
  kind text not null, provider text, recipient_list jsonb, subject text, body text,
  message_id text, delivery_status text not null default 'queued', failure_reason text,
  retry_count int not null default 0, sent_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.event_reschedule_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  old_starts_at timestamptz, old_ends_at timestamptz,
  new_starts_at timestamptz, new_ends_at timestamptz,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text, created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_events_public2 on public.events (business_status, moderation, starts_at) where deleted_at is null;
create index if not exists idx_events_org on public.events (org_id);
create index if not exists idx_events_type on public.events (event_type_id);
create index if not exists idx_events_format on public.events (format_kind);
create index if not exists idx_events_starts on public.events (starts_at) where deleted_at is null;
create index if not exists idx_events_ends on public.events (ends_at) where deleted_at is null;
create index if not exists idx_events_regdl on public.events (registration_deadline_at) where deleted_at is null;
create index if not exists idx_events_sched on public.events (scheduled_publish_at) where deleted_at is null;
create index if not exists idx_events_city on public.events (city);
create index if not exists idx_events_published2 on public.events (published_at desc) where deleted_at is null;
create index if not exists idx_events_tags on public.events using gin (tags);
create index if not exists idx_eregs_event2 on public.event_registrations (event_id);
create index if not exists idx_eregs_user2 on public.event_registrations (user_id);
create index if not exists idx_eregs_status on public.event_registrations (status);
create index if not exists idx_eregs_wait on public.event_registrations (event_id, waitlist_seq) where status='waitlisted';
create index if not exists idx_eregs_promo on public.event_registrations (promotion_status, promotion_expires_at) where promotion_status='offered';
create index if not exists idx_espeakers_event on public.event_speakers (event_id);
create index if not exists idx_epartners_event on public.event_partners (event_id);
create index if not exists idx_esched_event on public.event_schedule_items (event_id);
create index if not exists idx_ersh_reg on public.event_registration_status_history (registration_id);
create index if not exists idx_eatt_event on public.event_attendance (event_id);
create index if not exists idx_erem_due on public.event_reminders (status, scheduled_for);

-- ---------- FTS ----------
alter table public.events add column if not exists tsv tsvector generated always as (
  to_tsvector('simple', coalesce(title,'')||' '||coalesce(short_desc,'')||' '||coalesce(city,'')||' '||coalesce(venue_name,''))) stored;
create index if not exists idx_events_tsv on public.events using gin (tsv);

-- ---------- sequence для FIFO waitlist ----------
create sequence if not exists public.event_waitlist_seq;
