"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

export default function NewOrganizationPage() {
  const { ready, user } = useAuth();
  const { token } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ name: "", short_desc: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (ready && !user) return <div className="mx-auto max-w-[640px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб створити організацію</div>;

  async function create() {
    if (!f.name.trim()) { setMsg("Вкажіть назву"); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await apiFetch<{ id: string; slug: string }>("/api/organizations", { method: "POST", token, body: f });
      router.push(`/organizations/${r.id}/manage`);
    } catch (e) { setMsg(`Помилка: ${(e as { message?: string }).message ?? ""}`); setBusy(false); }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-6 text-[28px] font-extrabold tracking-tight">Нова організація</h1>
      <div className="flex flex-col gap-4">
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Назва *</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Короткий опис</label>
          <textarea value={f.short_desc} onChange={(e) => setF({ ...f, short_desc: e.target.value })} className="min-h-[100px] w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Місто</label>
          <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
        <button onClick={create} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">{busy ? "Створюю…" : "Створити чернетку"}</button>
        <p className="text-[12.5px] text-muted">Після створення заповніть деталі й надішліть на модерацію. Організація стане публічною після схвалення.</p>
      </div>
    </div>
  );
}
