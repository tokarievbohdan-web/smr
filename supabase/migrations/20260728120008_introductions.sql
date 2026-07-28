-- ============================================================
-- 008 · Introductions (запити на знайомство)
-- Обробляє partnership_manager; requester бачить власні.
-- ============================================================

create table if not exists public.introductions (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references public.profiles(id) on delete cascade,
  target_type   text,
  target_id     text,
  target_name   text,
  target_role   text,
  reason        text,
  context       text,
  expected_result text,
  related_type  text,
  related_id    text,
  related_label text,
  consent       boolean not null default false,
  status        intro_status not null default 'new',
  info_request  text,
  info_response text,
  manager_id    uuid references public.admin_users(id) on delete set null,
  priority      text default 'med',
  history       jsonb default '[]'::jsonb,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
