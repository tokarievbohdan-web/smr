-- ============================================================
-- RLS / авторизація — відтворювані тести (staging).
-- Запуск (staging БД, від імені postgres/service):
--   psql "$SUPABASE_DATABASE_URL" -f supabase/tests/rls_tests.sql
-- або вставити у Supabase SQL Editor.
--
-- Створює власні фікстури у транзакції та робить ROLLBACK — БД лишається
-- незмінною. Використовує SET LOCAL ROLE + request.jwt.claims для імітації
-- anon / authenticated / admin. Кожен провал кидає EXCEPTION 'FAIL ...'.
--
-- ⚠️ У dev-середовищі цього репозиторію немає локального Postgres, тож тест
-- НЕ виконувався тут. Він призначений для прогону на staging після db push.
-- ============================================================

begin;

-- ---------- Фікстури (від імені власника; тригери створять profiles) ----------
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','authenticated','authenticated','normal@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000002','authenticated','authenticated','other@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000003','authenticated','authenticated','blocked@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000004','authenticated','authenticated','owner@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','super@test.smr')
on conflict do nothing;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a2','authenticated','authenticated','mod@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a3','authenticated','authenticated','editor@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a4','authenticated','authenticated','analyst@test.smr'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a5','authenticated','authenticated','suspended@test.smr')
on conflict do nothing;

-- Профіль "іншого" користувача: приватний email + admin_notes, публічний профіль.
update public.profiles
   set email = 'other@test.smr', admin_notes = 'internal secret note',
       settings = '{"privacyPublic":true,"contactsPublic":false}'::jsonb,
       profile  = '{"firstName":"Оля","lastName":"Т","city":"Київ"}'::jsonb
 where id = '00000000-0000-0000-0000-000000000002';

-- Адміни з різними ролями.
insert into public.admin_users (id, email, name, role, status) values
  ('00000000-0000-0000-0000-0000000000a2','mod@test.smr','Mod','moderator','active'),
  ('00000000-0000-0000-0000-0000000000a3','editor@test.smr','Ed','editor','active'),
  ('00000000-0000-0000-0000-0000000000a4','analyst@test.smr','An','analyst','active'),
  ('00000000-0000-0000-0000-0000000000a5','suspended@test.smr','Sus','moderator','suspended')
on conflict (id) do nothing;

-- Організація на модерації (owner = user 4).
insert into public.organizations (id, name, status, verified, owner_id, admin_notes) values
  ('00000000-0000-0000-0000-0000000000c1','Test Org','pending',false,'00000000-0000-0000-0000-000000000004','org secret')
on conflict (id) do nothing;

-- Стаття: опублікована, але soft-deleted.
insert into public.articles (id, title, status, deleted_at, body) values
  ('00000000-0000-0000-0000-0000000000e1','Deleted Article','published', now(), '{"version":1,"blocks":[]}'::jsonb)
on conflict (id) do nothing;

-- Хелпер імітації особи.
create or replace function pg_temp.act_as(p_role text, p_sub text) returns void
language plpgsql as $$
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claims',
    case when p_sub is null then '' else json_build_object('sub', p_sub, 'role', p_role)::text end, true);
end $$;

-- ============================================================
-- НЕГАТИВНІ ТЕСТИ (усі мають "провалитись" для атакувальника)
-- ============================================================

-- 1) Користувач читає приватний email іншого користувача → 0 рядків базової таблиці.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ begin
  if exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL 1: normal user can read another profile base row (email leak)';
  end if;
  -- через public_profiles бачить профіль, але колонки email там немає взагалі
  if not exists (select 1 from public.public_profiles where id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL 1b: public profile not visible';
  end if;
  raise notice 'PASS 1: private email not readable; public_profiles OK';
end $$;
reset role;

-- 2) Користувач ставить собі verified = true → тригер скидає.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ begin
  update public.profiles set verified = true where id = '00000000-0000-0000-0000-000000000001';
  if (select verified from public.profiles where id = '00000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL 2: user self-verified';
  end if;
  raise notice 'PASS 2: self-verify blocked';
end $$;
reset role;

-- 3) Користувач змінює власний moderation/account status → скидається.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ begin
  update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-000000000001';
  if (select status from public.profiles where id = '00000000-0000-0000-0000-000000000001') <> 'active' then
    raise exception 'FAIL 3: user changed own status';
  end if;
  raise notice 'PASS 3: self status change blocked';
end $$;
reset role;

-- 4) Owner самостійно верифікує організацію → тригер скидає.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000004');
do $$ begin
  update public.organizations set verified = true, status = 'published'
    where id = '00000000-0000-0000-0000-0000000000c1';
  if (select verified from public.organizations where id = '00000000-0000-0000-0000-0000000000c1') then
    raise exception 'FAIL 4: owner self-verified organization';
  end if;
  if (select status from public.organizations where id = '00000000-0000-0000-0000-0000000000c1') = 'published' then
    raise exception 'FAIL 4b: owner self-published organization';
  end if;
  raise notice 'PASS 4: org self-verify/publish blocked';
end $$;
reset role;

-- 5) Користувач читає soft-deleted запис → не бачить.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ begin
  if exists (select 1 from public.articles where id = '00000000-0000-0000-0000-0000000000e1') then
    raise exception 'FAIL 5: soft-deleted article visible in base';
  end if;
  if exists (select 1 from public.public_articles where id = '00000000-0000-0000-0000-0000000000e1') then
    raise exception 'FAIL 5b: soft-deleted article visible in public view';
  end if;
  raise notice 'PASS 5: soft-deleted hidden';
end $$;
reset role;

-- 6) Звичайний користувач читає admin_notes → колонки немає у public view, база закрита.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='public_profiles' and column_name='admin_notes') then
    raise exception 'FAIL 6: admin_notes exposed in public_profiles';
  end if;
  raise notice 'PASS 6: admin_notes not exposed';
end $$;
reset role;

-- 7) Analyst виконує зміну даних (verify) → заборонено (не moderator).
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-0000000000a4');
do $$ begin
  -- прямий update: RLS не пускає (не owner, не moderator)
  update public.profiles set verified = true where id = '00000000-0000-0000-0000-000000000002';
  if (select verified from public.profiles where id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL 7: analyst modified data via base table';
  end if;
  raise notice 'PASS 7: analyst cannot mutate';
end $$;
reset role;

-- 8) Editor блокує користувача без ролі moderator → RPC відмовляє.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-0000000000a3');
do $$ declare ok boolean := false; begin
  begin
    perform public.admin_block_user('00000000-0000-0000-0000-000000000001');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 8: editor blocked a user without moderator role'; end if;
  raise notice 'PASS 8: editor block denied';
end $$;
reset role;

-- 9) Звичайний клієнт викликає admin RPC без ролі → відмова.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000001');
do $$ declare ok boolean := false; begin
  begin
    perform public.admin_verify_profile('00000000-0000-0000-0000-000000000002');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 9: non-admin called admin RPC'; end if;
  raise notice 'PASS 9: non-admin RPC denied';
end $$;
reset role;

-- 10) Suspended admin викликає привілейовану операцію → відмова.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-0000000000a5');
do $$ declare ok boolean := false; begin
  begin
    perform public.admin_verify_profile('00000000-0000-0000-0000-000000000002');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'FAIL 10: suspended admin executed privileged op'; end if;
  raise notice 'PASS 10: suspended admin denied';
end $$;
reset role;

-- ============================================================
-- ПОЗИТИВНІ ТЕСТИ
-- ============================================================

-- P1) Moderator успішно верифікує профіль (атомарно, з audit).
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-0000000000a2');
do $$ declare res jsonb; begin
  res := public.admin_verify_profile('00000000-0000-0000-0000-000000000002', 'req-test-1');
  if not (res->>'ok')::boolean then raise exception 'FAIL P1: verify returned not ok: %', res; end if;
  if not (select verified from public.profiles where id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL P1b: profile not verified after RPC';
  end if;
  -- повторний виклик ідемпотентний
  res := public.admin_verify_profile('00000000-0000-0000-0000-000000000002', 'req-test-1');
  if res->>'status' <> 'already_verified' then raise exception 'FAIL P1c: not idempotent: %', res; end if;
  raise notice 'PASS P1: moderator verify + idempotent';
end $$;
reset role;

-- P2) Audit-запис створено; anon його не бачить.
do $$ begin
  if not exists (select 1 from public.audit_log where action='verify_profile' and request_id='req-test-1') then
    raise exception 'FAIL P2: audit row missing';
  end if;
  raise notice 'PASS P2: audit written';
end $$;
select pg_temp.act_as('anon', null);
do $$ begin
  if exists (select 1 from public.audit_log) then
    raise exception 'FAIL P2b: anon can read audit_log';
  end if;
  raise notice 'PASS P2b: audit not readable by anon';
end $$;
reset role;

-- P3) Owner редагує дозволене бізнес-поле (name) — успішно.
select pg_temp.act_as('authenticated','00000000-0000-0000-0000-000000000004');
do $$ begin
  update public.organizations set name = 'Renamed Org' where id = '00000000-0000-0000-0000-0000000000c1';
  if (select name from public.organizations where id = '00000000-0000-0000-0000-0000000000c1') <> 'Renamed Org' then
    raise exception 'FAIL P3: owner could not edit own org name';
  end if;
  raise notice 'PASS P3: owner edits allowed business field';
end $$;
reset role;

rollback;

-- Якщо дійшли сюди без EXCEPTION — усі тести пройдено (зміни відкочено).
