-- ============================================================
-- 031 · Milestone 7 — Production hardening: ops-backbone (схема + RLS)
-- feature flags · beta invitations/cohorts · notification preferences ·
-- devices (push tokens) · unified delivery log · consent · feedback ·
-- account deletion · (data-quality/metrics/export — RPC у 032).
-- Коди інвайтів зберігаються ЛИШЕ хешованими (sha256 з Next-шару).
-- ============================================================

-- ---------- enums ----------
do $$ begin create type feedback_type as enum ('bug','improvement','rating','data_issue','other'); exception when duplicate_object then null; end $$;
do $$ begin create type feedback_status as enum ('new','triaged','planned','in_progress','resolved','rejected','duplicate'); exception when duplicate_object then null; end $$;
do $$ begin create type delivery_channel as enum ('in_app','push','email'); exception when duplicate_object then null; end $$;
do $$ begin create type delivery_status as enum ('queued','sent','delivered','failed','suppressed'); exception when duplicate_object then null; end $$;
do $$ begin create type invitation_status as enum ('active','revoked','expired','used'); exception when duplicate_object then null; end $$;

-- профілі: когорти beta + позначки видалення акаунта
alter table public.profiles add column if not exists cohorts text[] not null default '{}';
alter table public.profiles add column if not exists deletion_requested_at timestamptz;
alter table public.profiles add column if not exists deletion_effective_at timestamptz;

-- ---------- feature flags (server-controlled) ----------
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  environments text[] not null default '{}',        -- порожньо = усі середовища
  audience jsonb not null default '{}'::jsonb,       -- {cohorts:[],users:[],orgs:[]}
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------- beta invitations / cohorts ----------
create table if not exists public.beta_invitations (
  id uuid primary key default gen_random_uuid(),
  email text,
  code_hash text,                                    -- sha256(код), НІКОЛИ не зберігаємо raw
  invited_by uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  cohort text,
  max_uses int not null default 1,
  uses_count int not null default 0,
  expires_at timestamptz,
  status invitation_status not null default 'active',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null
);
create index if not exists idx_beta_inv_codehash on public.beta_invitations (code_hash) where code_hash is not null;
create index if not exists idx_beta_inv_email on public.beta_invitations (lower(email)) where email is not null;

-- ---------- notification preferences ----------
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  channels jsonb not null default '{"in_app":true,"push":true,"email":true}'::jsonb,
  categories jsonb not null default '{}'::jsonb,     -- {opportunities:{push:false},...}
  quiet_hours_start int,                             -- 0..23 локальної tz
  quiet_hours_end int,
  timezone text not null default 'Europe/Kyiv',
  reminder_frequency text not null default 'default',
  updated_at timestamptz not null default now()
);

-- ---------- devices (push tokens) ----------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,                            -- ios|android|web
  device_id text,
  push_token text,
  app_version text,
  environment text not null default 'production',
  notifications_enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, push_token)
);
create index if not exists idx_devices_user on public.devices (user_id) where invalidated_at is null;
create index if not exists idx_devices_token on public.devices (push_token) where invalidated_at is null;

-- ---------- unified delivery log ----------
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  event_key text,
  channel delivery_channel not null,
  template text,
  status delivery_status not null default 'queued',
  attempts int not null default 0,
  provider_message_id text,
  failure_code text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_deliv_user on public.notification_deliveries (user_id);
create index if not exists idx_deliv_status on public.notification_deliveries (channel, status);

-- ---------- consent tracking ----------
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,                        -- terms|privacy|marketing|public_contact|...
  document_version text not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists idx_consents_user on public.user_consents (user_id, consent_type);

-- ---------- feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type feedback_type not null default 'other',
  entity_type text, entity_id text,
  message text not null,
  app_version text, platform text, screen text,
  status feedback_status not null default 'new',
  priority text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_feedback_status on public.feedback (status, created_at desc);

do $$ begin create trigger t_devices_touch before update on public.devices for each row execute function public.touch_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger t_feedback_touch before update on public.feedback for each row execute function public.touch_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger t_notifprefs_touch before update on public.notification_preferences for each row execute function public.touch_updated_at(); exception when duplicate_object then null; end $$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.feature_flags            enable row level security;
alter table public.beta_invitations         enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.devices                  enable row level security;
alter table public.notification_deliveries  enable row level security;
alter table public.user_consents            enable row level security;
alter table public.feedback                 enable row level security;

-- feature flags: усі авторизовані читають (для UI-видимості); запис лише super_admin
drop policy if exists "ff: read" on public.feature_flags;
create policy "ff: read" on public.feature_flags for select using (true);
drop policy if exists "ff: super write" on public.feature_flags;
create policy "ff: super write" on public.feature_flags for all using (public.has_admin_role('super_admin')) with check (public.has_admin_role('super_admin'));

-- beta invitations: лише адміни (super_admin) читають/керують; redeem — через RPC (definer)
drop policy if exists "binv: admin" on public.beta_invitations;
create policy "binv: admin" on public.beta_invitations for all using (public.has_admin_role('super_admin')) with check (public.has_admin_role('super_admin'));

-- notification preferences: лише власник
drop policy if exists "np: own" on public.notification_preferences;
create policy "np: own" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- devices: лише власник (push_token видно тільки власнику; сервіс — через service_role)
drop policy if exists "dev: own" on public.devices;
create policy "dev: own" on public.devices for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- deliveries: власник читає власні; запис лише service_role/definer
drop policy if exists "deliv: own read" on public.notification_deliveries;
create policy "deliv: own read" on public.notification_deliveries for select using (user_id = auth.uid() or public.is_admin());

-- consents: власник
drop policy if exists "consent: own" on public.user_consents;
create policy "consent: own" on public.user_consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- feedback: власник створює/читає власне; адміни читають/оновлюють усе
drop policy if exists "fb: own insert" on public.feedback;
create policy "fb: own insert" on public.feedback for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "fb: own read" on public.feedback;
create policy "fb: own read" on public.feedback for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "fb: admin write" on public.feedback;
create policy "fb: admin write" on public.feedback for update using (public.is_admin()) with check (public.is_admin());
