-- ============================================================
-- 011 · RLS helper functions
-- ВАЖЛИВО: is_admin()/has_admin_role() — SECURITY DEFINER із фіксованим
-- search_path. Це:
--   1) прибирає рекурсію RLS (політика admin_users викликала is_admin,
--      який читав admin_users → нескінченна рекурсія у baseline-схемі);
--   2) визначає роль ЛИШЕ за серверною таблицею admin_users
--      (не за client JWT / app_metadata);
--   3) відмовляє suspended/deleted адмінам;
--   4) безпечний без сесії (auth.uid() is null → false).
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = auth.uid()
      and a.status = 'active'
      and a.deleted_at is null
  );
$$;

create or replace function public.has_admin_role(r admin_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = auth.uid()
      and a.status = 'active'
      and a.deleted_at is null
      and (a.role = 'super_admin' or a.role = r)
  );
$$;

-- Поточна admin-роль (для audit context / actor_role). Null якщо не адмін.
create or replace function public.current_admin_role()
returns admin_role
language sql
stable
security definer
set search_path = public
as $$
  select a.role from public.admin_users a
  where a.id = auth.uid() and a.status = 'active' and a.deleted_at is null;
$$;

-- Обмежуємо права виконання: анонім не має потреби у has_admin_role,
-- але is_admin викликається в RLS для anon-гілок → лишаємо execute усім ролям.
revoke all on function public.is_admin() from public;
revoke all on function public.has_admin_role(admin_role) from public;
revoke all on function public.current_admin_role() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.has_admin_role(admin_role) to anon, authenticated, service_role;
grant execute on function public.current_admin_role() to authenticated, service_role;

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create trigger t_profiles_touch     before update on public.profiles      for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_orgs_touch         before update on public.organizations for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_articles_touch     before update on public.articles      for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_opps_touch         before update on public.opportunities for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_apps_touch         before update on public.applications  for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_events_touch       before update on public.events        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_intros_touch       before update on public.introductions for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
