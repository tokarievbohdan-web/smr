"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type Opp = Record<string, unknown> & { id: string; version?: number; moderation?: string; business_status?: string; moderation_reason?: string; slug?: string };
type OType = { id: string; slug: string; title_uk: string };

export default function EditOpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = use(params); // param value = opportunity uuid
  const { ready, user, token } = useAuth();
  const [o, setO] = useState<Opp | null>(null);
  const [types, setTypes] = useState<OType[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const d = await apiFetch<Opp>(`/api/opportunities/${id}/manage`, { token });
    setO(d);
  }
  useEffect(() => {
    if (!ready || !token) return;
    apiFetch<{ items: OType[] }>("/api/opportunity-types", {}).then((d) => setTypes(d.items)).catch(() => {});
    load().catch(() => setMsg("Немає доступу до цієї можливості"));
  }, [ready, token, id]);

  if (!ready) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть для редагування</div>;
  if (msg && !o) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[15px] text-muted">{msg}</div>;
  if (!o) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;

  const set = (k: string, v: unknown) => setO({ ...o, [k]: v });
  async function save(submit = false) {
    if (!o) return;
    setBusy(true); setMsg(null);
    try {
      const r = await apiFetch<{ version: number }>(`/api/opportunities/${id}`, { method: "PATCH", token, body: {
        title: o.title, short_desc: o.short_desc, full_desc: o.full_desc, opportunity_type_id: o.opportunity_type_id,
        city: o.city, remote_mode: o.remote_mode, budget_vis: o.budget_vis,
        budget_from: o.budget_from ? Number(o.budget_from) : null, budget_to: o.budget_to ? Number(o.budget_to) : null,
        currency: o.currency, application_deadline: o.application_deadline || null, expiration_date: o.expiration_date || null,
        expectedVersion: o.version,
      } });
      setO({ ...o, version: r.version });
      if (submit) { await apiFetch(`/api/opportunities/${id}/submit`, { method: "POST", token }); await load(); setMsg("Надіслано на модерацію."); }
      else setMsg("Збережено.");
    } catch (e) { const err = e as { code?: string; message?: string }; setMsg(err.code === "conflict" ? "Змінено деінде — оновіть." : `Помилка: ${err.message ?? err.code ?? ""}`); }
    finally { setBusy(false); }
  }

  const F = (label: string, k: string, ta = false) => (
    <div><label className="mb-1 block text-[12.5px] font-bold text-muted">{label}</label>
      {ta ? <textarea value={(o![k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} className="min-h-[100px] w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" />
          : <input value={(o![k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" />}</div>
  );

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Можливість</h1>
        <div className="flex gap-2 text-[12px] font-bold">
          <span className="rounded-full bg-panel px-3 py-1 text-dim">модерація: {o.moderation}</span>
          <span className="rounded-full bg-panel px-3 py-1 text-dim">статус: {o.business_status}</span>
        </div>
      </div>
      {o.moderation === "changes_required" && o.moderation_reason && <div className="mb-4 rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">Потрібні зміни: {o.moderation_reason}</div>}

      <div className="flex flex-col gap-4">
        {F("Назва", "title")}{F("Короткий опис", "short_desc", true)}{F("Повний опис", "full_desc", true)}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Тип</label>
            <select value={(o.opportunity_type_id as string) ?? ""} onChange={(e) => set("opportunity_type_id", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none">
              <option value="">—</option>{types.map((t) => <option key={t.id} value={t.id}>{t.title_uk}</option>)}</select></div>
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Формат</label>
            <select value={(o.remote_mode as string) ?? "not_applicable"} onChange={(e) => set("remote_mode", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none">
              <option value="onsite">Офлайн</option><option value="remote">Дистанційно</option><option value="hybrid">Гібридно</option><option value="not_applicable">Не застосовується</option></select></div>
        </div>
        {F("Місто", "city")}
        <div className="grid grid-cols-4 gap-3">
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Бюджет</label>
            <select value={(o.budget_vis as string) ?? "not_specified"} onChange={(e) => set("budget_vis", e.target.value)} className="w-full rounded-xl bg-panel px-3 py-2.5 text-[13px] outline-none">
              <option value="public">Відкритий</option><option value="on_request">За запитом</option><option value="not_specified">Не вказаний</option></select></div>
          {F("Від", "budget_from")}{F("До", "budget_to")}{F("Валюта", "currency")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Дедлайн заявок</label>
            <input type="date" value={((o.application_deadline as string) ?? "").slice(0, 10)} onChange={(e) => set("application_deadline", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Дійсна до</label>
            <input type="date" value={((o.expiration_date as string) ?? "").slice(0, 10)} onChange={(e) => set("expiration_date", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        </div>
        {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => save(false)} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">Зберегти</button>
          {(o.moderation === "not_submitted" || o.moderation === "changes_required") && o.business_status === "draft" && <button onClick={() => save(true)} disabled={busy} className="rounded-full bg-panel px-5 py-2.5 text-[14px] font-bold text-dim">Зберегти й надіслати на модерацію</button>}
          <Link href={`/opportunities/${id}/applications`} className="ml-auto self-center text-[13px] font-bold text-accent">Відгуки →</Link>
        </div>
      </div>
    </div>
  );
}
