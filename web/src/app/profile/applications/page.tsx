"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const LABEL: Record<string, string> = { new: "Нова", viewed: "Переглянута", shortlisted: "У короткому списку", contacted: "Звʼязалися", accepted: "Прийнята", rejected: "Відхилена", withdrawn: "Відкликана" };
type App = { id: string; status: string; cover_message: string; submitted_at: string; opp?: { slug: string; title: string; business_status: string; org?: { name: string } } };

export default function MyApplicationsPage() {
  const { ready, user, token } = useAuth();
  const [items, setItems] = useState<App[] | null>(null);

  async function load() { const d = await apiFetch<{ items: App[] }>("/api/me/applications", { token }); setItems(d.items); }
  useEffect(() => { if (ready && token) load().catch(() => setItems([])); }, [ready, token]);

  async function withdraw(id: string) { try { await apiFetch(`/api/applications/${id}/withdraw`, { method: "POST", token }); await load(); } catch { /* ignore */ } }

  if (!ready) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб бачити відгуки</div>;

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Мої відгуки</h1>
      {items && items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-10 text-center text-[15px] text-muted">Ви ще не подавали відгуків.</div>
      ) : (
        <div className="flex flex-col gap-3">{(items ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl bg-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {a.opp && <Link href={`/opportunities/${a.opp.slug}`} className="text-[16px] font-extrabold leading-snug hover:text-accent">{a.opp.title}</Link>}
                <div className="mt-1 text-[12.5px] font-semibold text-muted">{a.opp?.org?.name} · {(a.submitted_at || "").slice(0, 10)}</div>
              </div>
              <span className="shrink-0 rounded-full bg-panel2 px-3 py-1 text-[12px] font-bold text-dim">{LABEL[a.status] ?? a.status}</span>
            </div>
            {["new", "viewed", "shortlisted", "contacted"].includes(a.status) && (
              <button onClick={() => withdraw(a.id)} className="mt-3 text-[12.5px] font-bold text-muted hover:text-accent">Відкликати</button>
            )}
          </div>
        ))}</div>
      )}
    </div>
  );
}
