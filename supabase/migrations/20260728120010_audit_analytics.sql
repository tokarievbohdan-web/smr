-- ============================================================
-- 010 · Audit log + analytics events
-- audit_log: незмінний з боку клієнта (немає update/delete політик, 012).
-- Пишеться всередині атомарних RPC (014). Не містить токенів/OTP/секретів.
-- ============================================================

create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role    text,
  action        text not null,
  entity_type   text,
  entity_id     text,                    -- text: ціль може бути не-uuid
  old_value     jsonb,
  new_value     jsonb,
  request_id    text,
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  event      text not null,
  props      jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
