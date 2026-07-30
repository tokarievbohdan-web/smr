"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type App = { id: string; user_id: string; status: string; cover_message: string; portfolio_url?: string; applicant_snapshot?: { display_name?: string; headline?: string; city?: string; verified?: boolean }; submitted_at: string };
const NEXT: Record<string, [string, string][]> = {
  new: [["viewed", "Переглянути"], ["rejected", "Відхилити"]],
  viewed: [["shortlisted", "У короткий список"], ["rejected", "Відхилити"]],
  shortlisted: [["contacted", "Звʼязались"], ["rejected", "Відхилити"]],
  contacted: [["accepted", "Прийняти"], ["rejected", "Відхилити"]],
};
const LABEL: Record<string, string> = { new: "Нова", viewed: "Переглянута", shortlisted: "Короткий список", contacted: "Звʼязались", accepted: "Прийнята", rejected: "Відхилена", withdrawn: "Відкликана" };

export default function WorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = use(params);
  const { ready, user, token } = useAuth();
  const [items, setItems] = useState<App[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() { const d = await apiFetch<{ items: App[] }>(`/api/opportunities/${id}/applications`, { token }); setItems(d.items); }
  useEffect(() => { if (ready && token) load().catch(() => setMsg("Немає доступу")); }, [ready, token, id]);

  async function setStatus(appId: string, status: string) { try { await apiFetch(`/api/applications/${appId}/status`, { method: "POST", token, body: { status } }); await load(); } catch (e) { setMsg(`Помилка: ${(e as { code?: string }).code ?? ""}`); } }
  async function note(appId: string) { const body = prompt("Внутрішня нотатка:"); if (!body) return; try { await apiFetch(`/api/applications/${appId}/notes`, { method: "POST", token, body: { body } }); setMsg("Нотатку додано."); } catch { setMsg("Помилка нотатки."); } }

  if (!ready) return <div className="mx-auto max-w-[820px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[820px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть</div>;
  if (msg && !items) return <div className="mx-auto max-w-[820px] px-6 pt-16 text-center text-[15px] text-muted">{msg}</div>;

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-tight">Відгуки</h1>
        <Link href={`/opportunities/${id}/edit`} className="text-[13px] font-bold text-accent">← Редагувати можливість</Link>
      </div>
      {msg && <div className="mb-4 rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
      {items && items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-10 text-center text-[15px] text-muted">Ще немає відгуків.</div>
      ) : (
        <div className="flex flex-col gap-3">{(items ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl bg-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/network/people/${a.user_id}`} className="flex items-center gap-1.5 text-[16px] font-extrabold hover:text-accent">{a.applicant_snapshot?.display_name ?? "Кандидат"}{a.applicant_snapshot?.verified && <span className="text-accent">✓</span>}</Link>
                <div className="text-[12.5px] font-semibold text-muted">{[a.applicant_snapshot?.headline, a.applicant_snapshot?.city].filter(Boolean).join(" · ")}</div>
              </div>
              <span className="shrink-0 rounded-full bg-panel2 px-3 py-1 text-[12px] font-bold text-dim">{LABEL[a.status] ?? a.status}</span>
            </div>
            {a.cover_message && <p className="mt-3 text-[14px] leading-relaxed text-ink/90">{a.cover_message}</p>}
            {a.portfolio_url && <a href={a.portfolio_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] font-semibold text-accent">Портфоліо ↗</a>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(NEXT[a.status] ?? []).map(([s, l]) => <button key={s} onClick={() => setStatus(a.id, s)} className="rounded-full bg-panel2 px-3.5 py-1.5 text-[12.5px] font-bold text-dim hover:text-accent">{l}</button>)}
              <button onClick={() => note(a.id)} className="rounded-full bg-panel2 px-3.5 py-1.5 text-[12.5px] font-bold text-muted">+ Нотатка</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
