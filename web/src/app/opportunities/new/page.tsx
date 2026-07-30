"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type Org = { id: string; name: string; moderation?: string };

export default function NewOpportunityPage() {
  const { ready, user, token } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [org, setOrg] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch<{ items: Org[] }>("/api/me/organizations", { token }).then((d) => { setOrgs(d.items); if (d.items[0]) setOrg(d.items[0].id); }).catch(() => setOrgs([]));
  }, [ready, token]);

  if (ready && !user) return <div className="mx-auto max-w-[640px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб створити можливість</div>;

  async function create() {
    if (!org) { setMsg("Оберіть організацію"); return; }
    if (!title.trim()) { setMsg("Вкажіть назву"); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await apiFetch<{ id: string }>(`/api/organizations/${org}/opportunities`, { method: "POST", token, body: { title } });
      router.push(`/opportunities/${r.id}/edit`);
    } catch (e) { setMsg(`Помилка: ${(e as { message?: string }).message ?? ""}`); setBusy(false); }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-6 text-[28px] font-extrabold tracking-tight">Нова можливість</h1>
      {orgs && orgs.length === 0 ? (
        <div className="rounded-2xl bg-panel p-6 text-[14px] text-dim">Спершу створіть організацію та дочекайтесь схвалення. <Link href="/organizations/new" className="font-bold text-accent">Створити організацію →</Link></div>
      ) : (
        <div className="flex flex-col gap-4">
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Організація</label>
            <select value={org} onChange={(e) => setOrg(e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none">
              {(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}{o.moderation !== "approved" ? " (на модерації)" : ""}</option>)}
            </select></div>
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Назва *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
          {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
          <button onClick={create} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">{busy ? "Створюю…" : "Створити чернетку"}</button>
        </div>
      )}
    </div>
  );
}
