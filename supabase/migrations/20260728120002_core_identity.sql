-- ============================================================
-- 002 · Core identity: admin_users + profiles
-- admin_users створюється рано — на нього посилаються helper-функції (011),
-- introductions (008) та audit_log (010).
-- Кожен користувач = 1 рядок auth.users (єдиний user id для mobile + web).
-- ============================================================

-- ---------- ADMIN USERS ----------
create table if not exists public.admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text,
  role       admin_role   not null default 'moderator',
  status     admin_status not null default 'active',   -- suspended/deleted → без прав (011)
  deleted_at timestamptz,
  created_at timestamptz  not null default now()
);

-- ---------- PROFILES (1:1 з auth.users) ----------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text unique not null,
  status           account_status not null default 'active',
  email_confirmed  boolean not null default false,
  verified         boolean not null default false,      -- ставиться лише адміном (RPC/тригер, 014)
  user_type        text,
  sports           text[] default '{}',
  directions       text[] default '{}',
  content_categories text[] default '{}',
  goals            text[] default '{}',
  availability     text[] default '{}',
  -- Публічна частина профілю (firstName,lastName,position,org,city,bio,photo,headline,skills,socials,portfolio…)
  profile          jsonb default '{}'::jsonb,
  -- Приватні налаштування (language,privacyPublic,contactsPublic,emailNotifications,phone…)
  settings         jsonb default '{}'::jsonb,
  admin_notes      text,                                 -- лише для адмінів; не потрапляє у public view
  onboarding_step  int not null default 0,
  deleted_at       timestamptz,                          -- soft delete
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
