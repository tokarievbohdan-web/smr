-- ============================================================
-- 001 · Extensions & enum types
-- SMR unified backend. Джерело правди — ці міграції (не schema.sql).
-- Ідемпотентно: безпечно застосовувати на чистій і на існуючій базі.
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------- Enum-и ----------
do $$ begin
  create type account_status as enum ('active','pending','suspended','blocked','deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type platform_role as enum ('specialist','org_rep','student','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum
    ('draft','pending','review','changes','published','scheduled','paused','closed','rejected','expired','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('new','viewed','shortlisted','contacted','accepted','rejected','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status as enum ('registered','waitlist','cancelled','attended','noshow');
exception when duplicate_object then null; end $$;

do $$ begin
  create type intro_status as enum ('new','review','moreinfo','approved','sent','declined','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('super_admin','editor','moderator','partnership_manager','event_manager','analyst');
exception when duplicate_object then null; end $$;

-- Статус службового акаунта: suspended/deleted не отримують адмін-прав (див. 011).
do $$ begin
  create type admin_status as enum ('active','suspended','deleted');
exception when duplicate_object then null; end $$;
