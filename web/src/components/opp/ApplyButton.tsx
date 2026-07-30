"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const STATUS_LABEL: Record<string, string> = {
  new: "Заявку подано", viewed: "Переглянуто", shortlisted: "У короткому списку",
  contacted: "Звʼязалися", accepted: "Прийнято", rejected: "Відхилено", withdrawn: "Відкликано",
};

export function ApplyButton({ oppId, applicationMethod, externalUrl }: { oppId: string; applicationMethod: string | null; externalUrl: string | null }) {
  const { ready, configured, user, token } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch<{ items: { id: string; status: string; opp?: { id: string } }[] }>("/api/me/applications", { token })
      .then((d) => { const m = d.items.find((x) => x.opp?.id === oppId); if (m) setStatus(m.status); })
      .catch(() => {});
  }, [ready, token, oppId]);

  if (!configured) return null;
  if (applicationMethod === "external" && externalUrl) {
    return <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-accent px-6 py-3 text-[15px] font-bold text-white">Подати заявку ↗</a>;
  }
  if (!ready) return <div className="h-12 w-40 animate-pulse rounded-full bg-panel" />;
  if (!user) return <div className="rounded-full bg-panel px-6 py-3 text-[14px] font-bold text-dim">Увійдіть, щоб відгукнутися</div>;
  if (status) return <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-6 py-3 text-[14px] font-bold text-accent">✓ {STATUS_LABEL[status] ?? status}</div>;

  async function submit() {
    setBusy(true); setMsg(null);
    try {
      await apiFetch("/api/opportunities/" + oppId + "/applications", { method: "POST", token, body: { coverMessage: cover, portfolioUrl: portfolio || undefined } });
      setStatus("new"); setOpen(false);
    } catch (e) { setMsg("Помилка: " + ((e as { message?: string }).message ?? "")); } finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex rounded-full bg-accent px-6 py-3 text-[15px] font-bold text-white">Подати заявку</button>;
  return (
    <div className="rounded-2xl bg-panel p-5">
      <label className="mb-1 block text-[12.5px] font-bold text-muted">Супровідне повідомлення</label>
      <textarea value={cover} onChange={(e) => setCover(e.target.value)} className="min-h-[100px] w-full rounded-xl bg-panel2 px-3.5 py-2.5 text-[14px] outline-none" />
      <label className="mb-1 mt-3 block text-[12.5px] font-bold text-muted">Портфоліо (URL)</label>
      <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full rounded-xl bg-panel2 px-3.5 py-2.5 text-[14px] outline-none" />
      {msg && <div className="mt-2 text-[12.5px] font-semibold text-muted">{msg}</div>}
      <div className="mt-3 flex gap-2">
        <button onClick={submit} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">{busy ? "Надсилаю…" : "Надіслати"}</button>
        <button onClick={() => setOpen(false)} className="rounded-full bg-panel2 px-5 py-2.5 text-[14px] font-bold text-dim">Скасувати</button>
      </div>
    </div>
  );
}
