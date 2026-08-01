"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type Reg = { id: string; status: string; promotion_status?: string; promotion_expires_at?: string | null } | null;
type Props = {
  eventId: string; businessStatus: string; registrationMode: string; ticketType: string;
  externalUrl: string | null; waitlistEnabled: boolean; spotsLeft: number | null;
};

export function EventRegister(p: Props) {
  const { ready, user, token } = useAuth();
  const [reg, setReg] = useState<Reg>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [access, setAccess] = useState<{ online_private_url?: string; venue_name?: string; address?: string } | null>(null);

  async function loadMine() {
    if (!token) return;
    try { const d = await apiFetch<{ myRegistration: Reg }>(`/api/events/${p.eventId}`, { token }); setReg(d.myRegistration ?? null); }
    catch { /* ignore */ }
  }
  useEffect(() => { if (ready && token) loadMine(); }, [ready, token]);

  async function act(path: string, body?: unknown) {
    setBusy(true); setMsg(null);
    try { await apiFetch(path, { method: "POST", token, body }); await loadMine(); }
    catch (e) { setMsg(errText((e as { code?: string }).code)); }
    finally { setBusy(false); }
  }

  const cancelled = p.businessStatus === "cancelled";
  const completed = p.businessStatus === "completed";
  const external = p.ticketType === "paid_external" || p.registrationMode === "external";
  const st = reg?.status;
  const offered = st === "waitlisted" && reg?.promotion_status === "offered";

  // ---- CTA рендер ----
  let cta: React.ReactNode;
  if (cancelled) cta = <Disabled>Подію скасовано</Disabled>;
  else if (completed && !st) cta = <Disabled>Подія завершена</Disabled>;
  else if (!ready) cta = <Disabled>…</Disabled>;
  else if (!user) cta = <a href="/?login=1" className={btnPrimary}>Увійдіть, щоб зареєструватися</a>;
  else if (offered) cta = (
    <div className="flex flex-col gap-2">
      <div className="text-[13px] font-bold text-accent">Звільнилось місце — підтвердіть участь</div>
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/waitlist/accept`)} className={btnPrimary}>Підтвердити місце</button>
        <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/waitlist/decline`)} className={btnGhost}>Відмовитись</button>
      </div>
    </div>
  );
  else if (st === "registered") cta = (
    <div className="flex flex-col gap-2">
      <div className={badgeOk}>✓ Ви зареєстровані</div>
      <div className="flex flex-wrap gap-2">
        <a href={`/api/events/${p.eventId}/calendar`} className={btnGhost}>Додати в календар</a>
        <button disabled={busy} onClick={() => loadAccess()} className={btnGhost}>Деталі доступу</button>
        <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/cancel-registration`)} className={btnGhost}>Скасувати</button>
      </div>
      {access && <div className="rounded-xl bg-panel2 p-3 text-[13px] font-semibold text-dim">{access.online_private_url ? <a href={access.online_private_url} target="_blank" rel="noreferrer" className="text-accent">Посилання на подію</a> : [access.venue_name, access.address].filter(Boolean).join(", ") || "Деталі надішлемо перед подією"}</div>}
    </div>
  );
  else if (st === "pending") cta = (
    <div className="flex flex-col gap-2"><div className={badgeWait}>Очікує підтвердження організатором</div>
      <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/cancel-registration`)} className={btnGhost}>Скасувати заявку</button></div>
  );
  else if (st === "waitlisted") cta = (
    <div className="flex flex-col gap-2"><div className={badgeWait}>Ви у списку очікування</div>
      <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/cancel-registration`)} className={btnGhost}>Вийти зі списку</button></div>
  );
  else if (external && p.externalUrl) cta = <a href={p.externalUrl} target="_blank" rel="noreferrer" className={btnPrimary}>Перейти до квитків →</a>;
  else if (p.registrationMode === "disabled") cta = <Disabled>Реєстрацію закрито</Disabled>;
  else {
    const full = p.spotsLeft !== null && p.spotsLeft <= 0;
    if (full && p.waitlistEnabled) cta = <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/register`, { shareProfile: true, shareList: true })} className={btnPrimary}>У список очікування</button>;
    else if (full) cta = <Disabled>Місць немає</Disabled>;
    else cta = <button disabled={busy} onClick={() => act(`/api/events/${p.eventId}/register`, { shareProfile: true, shareList: true })} className={btnPrimary}>{p.registrationMode === "approval_required" ? "Подати заявку на участь" : "Зареєструватися"}</button>;
  }

  async function loadAccess() {
    try { setAccess(await apiFetch(`/api/events/${p.eventId}/access`, { token })); } catch { setAccess({}); }
  }

  return <div className="flex flex-col gap-2">{cta}{msg && <div className="text-[12.5px] font-semibold text-red-500">{msg}</div>}</div>;
}

const btnPrimary = "rounded-xl bg-accent px-5 py-3 text-[14px] font-bold text-white text-center transition hover:opacity-90 disabled:opacity-60";
const btnGhost = "rounded-xl bg-panel2 px-4 py-2.5 text-[13px] font-bold text-dim text-center transition hover:text-ink disabled:opacity-60";
const badgeOk = "rounded-xl bg-accent/12 px-4 py-3 text-[14px] font-bold text-accent";
const badgeWait = "rounded-xl bg-amber-500/12 px-4 py-3 text-[14px] font-bold text-amber-600";
function Disabled({ children }: { children: React.ReactNode }) { return <div className="rounded-xl bg-panel2 px-5 py-3 text-center text-[14px] font-bold text-muted">{children}</div>; }
function errText(code?: string): string {
  const m: Record<string, string> = { validation: "Реєстрація недоступна", conflict: "Ви вже зареєстровані", forbidden: "Немає доступу", not_found: "Подію не знайдено" };
  return (code && m[code]) || "Сталася помилка, спробуйте пізніше";
}
