"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type Org = { id: string; name: string; slug: string; moderation: string; role: string };
type EType = { id: string; slug: string; title_uk: string };

export default function NewEventPage() {
  const { ready, user, token } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [types, setTypes] = useState<EType[]>([]);
  const [f, setF] = useState<Record<string, string | boolean>>({ format_kind: "offline", ticket_type: "free", registration_mode: "instant", timezone: "Europe/Kyiv", waitlist_enabled: true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (ready && token) apiFetch<{ items: Org[] }>("/api/me/organizations", { token }).then((d) => { const ap = d.items.filter((o) => o.moderation === "approved"); setOrgs(ap); if (ap[0]) set("org", ap[0].id); }).catch(() => {});
    apiFetch<{ items: EType[] }>("/api/event-types").then((d) => { setTypes(d.items); if (d.items[0]) set("event_type_id", d.items[0].id); }).catch(() => {});
  }, [ready, token]);

  async function submit(sendToModeration: boolean) {
    setBusy(true); setMsg(null);
    try {
      const org = f.org as string;
      if (!org) throw { code: "validation" };
      const created = await apiFetch<{ id: string }>(`/api/organizations/${org}/events`, { method: "POST", token, body: { title: f.title } });
      const patch: Record<string, unknown> = {
        title: f.title, short_desc: f.short_desc, full_desc: f.full_desc, event_type_id: f.event_type_id, format_kind: f.format_kind,
        country: f.country, city: f.city, venue_name: f.venue_name, address: f.address, online_platform: f.online_platform,
        timezone: f.timezone, starts_at: f.starts_at ? new Date(f.starts_at as string).toISOString() : null, ends_at: f.ends_at ? new Date(f.ends_at as string).toISOString() : null,
        registration_deadline_at: f.registration_deadline_at ? new Date(f.registration_deadline_at as string).toISOString() : null,
        capacity: f.capacity ? Number(f.capacity) : null, waitlist_enabled: !!f.waitlist_enabled,
        ticket_type: f.ticket_type, external_ticket_url: f.external_ticket_url, registration_mode: f.registration_mode,
        participant_list_vis: "hidden",
      };
      await apiFetch(`/api/events/${created.id}`, { method: "PATCH", token, body: patch });
      if (sendToModeration) { await apiFetch(`/api/events/${created.id}/submit`, { method: "POST", token }); setMsg("Подію надіслано на модерацію ✓"); setTimeout(() => router.push("/profile/events"), 1200); }
      else { setMsg("Чернетку збережено ✓"); }
    } catch (e) { setMsg("Помилка: " + ((e as { code?: string }).code ?? "перевірте обовʼязкові поля")); }
    finally { setBusy(false); }
  }

  if (!ready) return <div className="mx-auto max-w-[720px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[720px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб створити подію</div>;
  if (orgs.length === 0) return <div className="mx-auto max-w-[720px] px-6 pt-16 text-center text-[15px] text-muted">Створювати події можуть лише схвалені організації. <Link href="/network/organizations" className="font-bold text-accent">До мережі →</Link></div>;

  const online = f.format_kind === "online" || f.format_kind === "hybrid";
  const offline = f.format_kind === "offline" || f.format_kind === "hybrid";
  const I = (k: string, ph: string, type = "text") => (
    <input type={type} value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} className="w-full rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
  );

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-10 md:px-8">
      <Link href="/events" className="text-[13px] font-bold text-accent">← До подій</Link>
      <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">Нова подія</h1>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1"><span className={lbl}>Організація</span>
          <select value={f.org as string} onChange={(e) => set("org", e.target.value)} className={sel}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Назва *</span>{I("title", "Назва події")}</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Тип *</span>
            <select value={f.event_type_id as string} onChange={(e) => set("event_type_id", e.target.value)} className={sel}>{types.map((t) => <option key={t.id} value={t.id}>{t.title_uk}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Формат *</span>
            <select value={f.format_kind as string} onChange={(e) => set("format_kind", e.target.value)} className={sel}>
              <option value="offline">Офлайн</option><option value="online">Онлайн</option><option value="hybrid">Гібрид</option><option value="deadline_only">Лише дедлайн</option></select></label>
        </div>
        <label className="flex flex-col gap-1"><span className={lbl}>Короткий опис</span>{I("short_desc", "Одне речення про подію")}</label>
        <label className="flex flex-col gap-1"><span className={lbl}>Опис</span>
          <textarea value={(f.full_desc as string) ?? ""} onChange={(e) => set("full_desc", e.target.value)} placeholder="Деталі, спікери, програма" className="min-h-[100px] w-full rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" /></label>
        {offline && <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Країна *</span>{I("country", "Україна")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Місто *</span>{I("city", "Київ")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Майданчик *</span>{I("venue_name", "Назва локації")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Адреса</span>{I("address", "вул. …")}</label>
        </div>}
        {online && <label className="flex flex-col gap-1"><span className={lbl}>Онлайн-платформа *</span>{I("online_platform", "Zoom / YouTube / …")}</label>}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Початок *</span>{I("starts_at", "", "datetime-local")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Завершення</span>{I("ends_at", "", "datetime-local")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Дедлайн реєстрації</span>{I("registration_deadline_at", "", "datetime-local")}</label>
          <label className="flex flex-col gap-1"><span className={lbl}>Місткість</span>{I("capacity", "напр. 100", "number")}</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Реєстрація</span>
            <select value={f.registration_mode as string} onChange={(e) => set("registration_mode", e.target.value)} className={sel}>
              <option value="instant">Миттєва</option><option value="approval_required">З підтвердженням</option><option value="external">Зовнішня</option><option value="disabled">Вимкнена</option></select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Квитки</span>
            <select value={f.ticket_type as string} onChange={(e) => set("ticket_type", e.target.value)} className={sel}>
              <option value="free">Безкоштовно</option><option value="paid_external">Платно (зовнішньо)</option><option value="invitation_only">За запрошенням</option><option value="not_applicable">Не застосовно</option></select></label>
        </div>
        {(f.ticket_type === "paid_external" || f.registration_mode === "external") && <label className="flex flex-col gap-1"><span className={lbl}>Зовнішнє посилання *</span>{I("external_ticket_url", "https://…")}</label>}
        <label className="flex items-center gap-2 text-[13px] font-semibold text-dim"><input type="checkbox" checked={!!f.waitlist_enabled} onChange={(e) => set("waitlist_enabled", e.target.checked)} /> Увімкнути список очікування</label>

        {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => submit(true)} className="rounded-xl bg-accent px-5 py-3 text-[14px] font-bold text-white disabled:opacity-60">Надіслати на модерацію</button>
          <button disabled={busy} onClick={() => submit(false)} className="rounded-xl bg-panel2 px-5 py-3 text-[14px] font-bold text-dim disabled:opacity-60">Зберегти чернетку</button>
        </div>
      </div>
    </div>
  );
}
const lbl = "text-[12px] font-extrabold uppercase tracking-wider text-muted";
const sel = "w-full rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none";
