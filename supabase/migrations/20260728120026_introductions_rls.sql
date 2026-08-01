-- ============================================================
-- 026 · Milestone 5 — Introductions: RLS, хелпери, тригер-барʼєр
-- ============================================================

alter table public.introduction_types           enable row level security;
alter table public.introduction_status_history  enable row level security;
alter table public.introduction_internal_notes  enable row level security;
alter table public.introduction_messages        enable row level security;
alter table public.introduction_follow_ups      enable row level security;
alter table public.introduction_outcomes        enable row level security;
alter table public.introduction_consent_tokens  enable row level security;

-- ---------- helpers ----------
create or replace function public.intro_is_party(p_intro uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.introductions i where i.id = p_intro and (i.requester_id = auth.uid() or i.target_user_id = auth.uid()));
$$;
create or replace function public.is_pm()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_admin_role('partnership_manager');
$$;
revoke all on function public.intro_is_party(uuid), public.is_pm() from public;
grant execute on function public.intro_is_party(uuid), public.is_pm() to anon, authenticated, service_role;

-- ---------- introductions read/insert/update ----------
drop policy if exists "intros: requester/pm read" on public.introductions;
drop policy if exists "intros: parties/pm read" on public.introductions;
create policy "intros: parties/pm read" on public.introductions
  for select using (requester_id = auth.uid() or target_user_id = auth.uid() or public.is_pm());
drop policy if exists "intros: requester insert" on public.introductions;
create policy "intros: requester insert" on public.introductions
  for insert with check (requester_id = auth.uid());
drop policy if exists "intros: requester/pm update" on public.introductions;
drop policy if exists "intros: parties/pm update" on public.introductions;
create policy "intros: parties/pm update" on public.introductions
  for update using (requester_id = auth.uid() or target_user_id = auth.uid() or public.is_pm());

-- ---------- types ----------
drop policy if exists "itypes: read" on public.introduction_types;
create policy "itypes: read" on public.introduction_types for select using (true);
drop policy if exists "itypes: admin write" on public.introduction_types;
create policy "itypes: admin write" on public.introduction_types for all using (public.is_admin()) with check (public.is_admin());

-- ---------- status history: сторони бачать (public-safe events + public_note); PM усе ----------
drop policy if exists "ish: read" on public.introduction_status_history;
create policy "ish: read" on public.introduction_status_history
  for select using (public.is_pm() or public.intro_is_party(introduction_id));

-- ---------- internal notes / messages: лише PM/admin (приховано від сторін) ----------
drop policy if exists "iin: pm read" on public.introduction_internal_notes;
create policy "iin: pm read" on public.introduction_internal_notes for select using (public.is_pm());
drop policy if exists "iin: pm write" on public.introduction_internal_notes;
create policy "iin: pm write" on public.introduction_internal_notes for all using (public.is_pm()) with check (public.is_pm());

drop policy if exists "imsg: pm read" on public.introduction_messages;
create policy "imsg: pm read" on public.introduction_messages for select using (public.is_pm());

-- ---------- follow-ups / outcomes: сторони + PM ----------
drop policy if exists "ifu: read" on public.introduction_follow_ups;
create policy "ifu: read" on public.introduction_follow_ups for select using (public.is_pm() or public.intro_is_party(introduction_id));
drop policy if exists "iout: read" on public.introduction_outcomes;
create policy "iout: read" on public.introduction_outcomes for select using (public.is_pm() or public.intro_is_party(introduction_id));
-- consent tokens: клієнт не читає (лише RPC/service)

-- ============================================================
-- ТРИГЕР-БАРʼЄР: системні поля лише через RPC (флаг) або PM
-- Requester/Target редагують лише дозволені поля; статус/manager/контакти/
-- consent/outcome/reasons — виключно через server-operations.
-- ============================================================
create or replace function public.guard_intros_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv or public.is_pm() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := coalesce(nullif(new.status,'draft'),'new'); if new.status not in ('draft','new') then new.status := 'new'; end if;
    new.manager_id := null; new.assigned_at := null; new.approved_at := null; new.approved_by := null;
    new.introduction_sent_at := null; new.closed_at := null; new.declined_at := null; new.cancelled_at := null;
    new.target_consent_status := 'not_required'; new.target_responded_at := null; new.target_shared_contacts := '{}'::jsonb;
    new.public_reason := null; new.internal_reason := null; new.internal_resolution := null; new.intro_message := null;
    new.follow_up_due_at := null; new.priority2 := 'normal'; new.version := 1;
    new.requester_id := auth.uid();
  else
    new.status := old.status; new.manager_id := old.manager_id; new.assigned_at := old.assigned_at;
    new.approved_at := old.approved_at; new.approved_by := old.approved_by;
    new.introduction_sent_at := old.introduction_sent_at; new.closed_at := old.closed_at;
    new.declined_at := old.declined_at; new.cancelled_at := old.cancelled_at;
    new.target_consent_status := old.target_consent_status; new.target_responded_at := old.target_responded_at;
    new.target_shared_contacts := old.target_shared_contacts; new.target_response_message := old.target_response_message;
    new.public_reason := old.public_reason; new.internal_reason := old.internal_reason;
    new.internal_resolution := old.internal_resolution; new.intro_message := old.intro_message;
    new.priority2 := old.priority2; new.follow_up_due_at := old.follow_up_due_at;
    new.requester_id := old.requester_id; new.version := old.version + 1;
  end if;
  return new;
end $$;
drop trigger if exists t_intros_guard on public.introductions;
create trigger t_intros_guard before insert or update on public.introductions
  for each row execute function public.guard_intros_write();

do $$ begin
  create trigger t_iin_touch before update on public.introduction_internal_notes for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
