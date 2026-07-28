-- ============================================================
-- 014 · Column guards (тригери) + еталонні атомарні admin RPC
-- RLS захищає рядок, але НЕ колонку. Тригери гарантують, що звичайний
-- користувач не підвищить привілеї (verified/featured) і не змінить
-- службові статуси в обхід модерації, навіть маючи право update на рядок.
-- ============================================================

-- ---------- PROFILES guard ----------
create or replace function public.guard_profiles_write()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if public.has_admin_role('moderator') then   -- moderator/super_admin bypass; analyst/editor — ні
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified    := false;
    new.admin_notes := null;
    new.deleted_at  := null;
    if new.status not in ('active','pending') then new.status := 'active'; end if;
  else -- UPDATE
    new.verified    := old.verified;
    new.status      := old.status;
    new.email       := old.email;
    new.admin_notes := old.admin_notes;
    new.deleted_at  := old.deleted_at;
  end if;
  return new;
end $$;
drop trigger if exists t_profiles_guard on public.profiles;
create trigger t_profiles_guard before insert or update on public.profiles
  for each row execute function public.guard_profiles_write();

-- ---------- ORGANIZATIONS guard ----------
create or replace function public.guard_orgs_write()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if public.has_admin_role('moderator') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified    := false;
    new.featured    := false;
    new.admin_notes := null;
    new.deleted_at  := null;
    if new.status not in ('draft','pending') then new.status := 'pending'; end if;
  else -- UPDATE: власник міняє лише бізнес-поля
    new.verified    := old.verified;
    new.featured    := old.featured;
    new.admin_notes := old.admin_notes;
    new.deleted_at  := old.deleted_at;
    new.owner_id    := old.owner_id;   -- зміна власника — окремий workflow
    if new.status is distinct from old.status and new.status not in ('draft','pending') then
      new.status := old.status;        -- публікацію/архів робить лише модерація
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_orgs_guard on public.organizations;
create trigger t_orgs_guard before insert or update on public.organizations
  for each row execute function public.guard_orgs_write();

-- ---------- OPPORTUNITIES guard ----------
create or replace function public.guard_opps_write()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if public.has_admin_role('moderator') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified    := false;
    new.featured    := false;
    new.admin_notes := null;
    new.deleted_at  := null;
    if new.status not in ('draft','pending') then new.status := 'pending'; end if;
  else -- UPDATE: автор може draft/pending/paused/closed, але не published/verified/featured
    new.verified    := old.verified;
    new.featured    := old.featured;
    new.admin_notes := old.admin_notes;
    new.deleted_at  := old.deleted_at;
    if new.status is distinct from old.status and new.status not in ('draft','pending','paused','closed') then
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_opps_guard on public.opportunities;
create trigger t_opps_guard before insert or update on public.opportunities
  for each row execute function public.guard_opps_write();

-- ============================================================
-- Еталонні атомарні admin-операції.
-- Виклик: Next.js API з JWT адміна (anon key + Authorization: Bearer),
-- тому auth.uid() = адмін. Роль перевіряється в БД (не довіряємо клієнту).
-- SECURITY DEFINER + фіксований search_path + перевірка ролі + audit.
-- Ідемпотентні: повторний виклик не дублює зміну й audit.
-- ============================================================

create or replace function public.admin_verify_profile(p_profile_id uuid, p_request_id text default null)
returns jsonb language plpgsql
security definer set search_path = public
as $$
declare v_old boolean; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('moderator') then
    raise exception 'forbidden: moderator role required' using errcode = '42501';
  end if;
  select verified into v_old from public.profiles
    where id = p_profile_id and deleted_at is null for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if v_old then
    return jsonb_build_object('ok', true, 'status', 'already_verified', 'profile_id', p_profile_id);
  end if;
  update public.profiles set verified = true where id = p_profile_id;
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
    values (v_actor, public.current_admin_role()::text, 'verify_profile', 'profile', p_profile_id::text,
            jsonb_build_object('verified', v_old), jsonb_build_object('verified', true), p_request_id);
  return jsonb_build_object('ok', true, 'status', 'verified', 'profile_id', p_profile_id);
end $$;

create or replace function public.admin_verify_organization(p_org_id uuid, p_request_id text default null)
returns jsonb language plpgsql
security definer set search_path = public
as $$
declare v_verified boolean; v_status moderation_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('moderator') then
    raise exception 'forbidden: moderator role required' using errcode = '42501';
  end if;
  select verified, status into v_verified, v_status from public.organizations
    where id = p_org_id and deleted_at is null for update;
  if not found then
    raise exception 'organization not found' using errcode = 'P0002';
  end if;
  if v_verified then
    return jsonb_build_object('ok', true, 'status', 'already_verified', 'org_id', p_org_id);
  end if;
  update public.organizations
     set verified = true,
         status = case when v_status = 'pending' then 'published'::moderation_status else v_status end
   where id = p_org_id;
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
    values (v_actor, public.current_admin_role()::text, 'verify_organization', 'organization', p_org_id::text,
            jsonb_build_object('verified', v_verified, 'status', v_status),
            jsonb_build_object('verified', true), p_request_id);
  return jsonb_build_object('ok', true, 'status', 'verified', 'org_id', p_org_id);
end $$;

create or replace function public.admin_block_user(p_profile_id uuid, p_reason text default null, p_request_id text default null)
returns jsonb language plpgsql
security definer set search_path = public
as $$
declare v_status account_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('moderator') then
    raise exception 'forbidden: moderator role required' using errcode = '42501';
  end if;
  select status into v_status from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if v_status = 'blocked' then
    return jsonb_build_object('ok', true, 'status', 'already_blocked', 'profile_id', p_profile_id);
  end if;
  update public.profiles set status = 'blocked' where id = p_profile_id;
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
    values (v_actor, public.current_admin_role()::text, 'block_user', 'profile', p_profile_id::text,
            jsonb_build_object('status', v_status),
            jsonb_build_object('status', 'blocked', 'reason', p_reason), p_request_id);
  return jsonb_build_object('ok', true, 'status', 'blocked', 'profile_id', p_profile_id);
end $$;

create or replace function public.admin_unblock_user(p_profile_id uuid, p_request_id text default null)
returns jsonb language plpgsql
security definer set search_path = public
as $$
declare v_status account_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('moderator') then
    raise exception 'forbidden: moderator role required' using errcode = '42501';
  end if;
  select status into v_status from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if v_status <> 'blocked' then
    return jsonb_build_object('ok', true, 'status', 'not_blocked', 'profile_id', p_profile_id);
  end if;
  update public.profiles set status = 'active' where id = p_profile_id;
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
    values (v_actor, public.current_admin_role()::text, 'unblock_user', 'profile', p_profile_id::text,
            jsonb_build_object('status', v_status),
            jsonb_build_object('status', 'active'), p_request_id);
  return jsonb_build_object('ok', true, 'status', 'active', 'profile_id', p_profile_id);
end $$;

-- Права: лише авторизовані (адмін-перевірка — всередині). Ніколи anon/public.
revoke all on function public.admin_verify_profile(uuid, text)             from public, anon;
revoke all on function public.admin_verify_organization(uuid, text)        from public, anon;
revoke all on function public.admin_block_user(uuid, text, text)           from public, anon;
revoke all on function public.admin_unblock_user(uuid, text)               from public, anon;
grant execute on function public.admin_verify_profile(uuid, text)          to authenticated, service_role;
grant execute on function public.admin_verify_organization(uuid, text)     to authenticated, service_role;
grant execute on function public.admin_block_user(uuid, text, text)        to authenticated, service_role;
grant execute on function public.admin_unblock_user(uuid, text)            to authenticated, service_role;

-- ---------- Автостворення профілю при реєстрації в auth.users ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, status, email_confirmed)
  values (new.id, new.email, 'active', coalesce(new.email_confirmed_at is not null, false))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
