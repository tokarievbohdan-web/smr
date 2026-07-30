"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type IType = { id: string; slug: string; title_uk: string; requires_value_for_target: boolean };

export function IntroduceButton({ targetProfileId, targetOrganizationId, relatedType, relatedId }: {
  targetProfileId?: string; targetOrganizationId?: string; relatedType?: string; relatedId?: string;
}) {
  const { ready, configured, user, token } = useAuth();
  const [types, setTypes] = useState<IType[]>([]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ request_type_id: "", subject: "", context: "", expected_outcome: "", value_for_target: "", email: true, phone: false });

  useEffect(() => { if (open && types.length === 0) apiFetch<{ items: IType[] }>("/api/introduction-types", {}).then((d) => { setTypes(d.items); setF((s) => ({ ...s, request_type_id: d.items[0]?.id ?? "" })); }).catch(() => {}); }, [open, types.length]);

  if (!configured) return null;
  if (ready && !user) return <div className="rounded-full bg-panel px-5 py-2.5 text-[13.5px] font-bold text-dim">Увійдіть, щоб запросити знайомство</div>;
  if (done) return <div className="inline-flex rounded-full bg-accent/15 px-5 py-2.5 text-[13.5px] font-bold text-accent">✓ Запит надіслано</div>;
  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white">Запросити знайомство</button>;

  async function submit() {
    if (!f.subject.trim() || !f.context.trim() || !f.expected_outcome.trim()) { setMsg("Заповніть тему, контекст і результат"); return; }
    setBusy(true); setMsg(null);
    try {
      const created = await apiFetch<{ id: string }>("/api/introductions", { method: "POST", token, body: {
        target_profile_id: targetProfileId, target_organization_id: targetOrganizationId,
        request_type_id: f.request_type_id, subject: f.subject, context: f.context,
        expected_outcome: f.expected_outcome, value_for_target: f.value_for_target,
        consent_to_share_contacts: true, requester_shared_contacts: { email: f.email, phone: f.phone },
        related_entity_type: relatedType, related_entity_id: relatedId,
      } });
      await apiFetch(`/api/introductions/${created.id}/submit`, { method: "POST", token });
      setDone(true); setOpen(false);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setMsg(err.code === "conflict" ? "У вас уже є активний запит до цієї сторони" : `Помилка: ${err.message ?? err.code ?? ""}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl bg-panel p-5">
      <div className="text-[15px] font-extrabold">Запит на знайомство</div>
      <p className="mt-1 text-[12.5px] text-muted">SMR перевірить контекст і зʼєднає сторони. Контакти не розкриваються без згоди обох сторін.</p>
      <div className="mt-4 flex flex-col gap-3">
        <div><label className="mb-1 block text-[12px] font-bold text-muted">Причина</label>
          <select value={f.request_type_id} onChange={(e) => setF({ ...f, request_type_id: e.target.value })} className="w-full rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none">
            {types.map((t) => <option key={t.id} value={t.id}>{t.title_uk}</option>)}</select></div>
        <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Тема" className="rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
        <textarea value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} placeholder="Контекст: хто ви, чому звертаєтесь" className="min-h-[80px] rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
        <input value={f.expected_outcome} onChange={(e) => setF({ ...f, expected_outcome: e.target.value })} placeholder="Очікуваний результат (напр. короткий дзвінок)" className="rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
        <textarea value={f.value_for_target} onChange={(e) => setF({ ...f, value_for_target: e.target.value })} placeholder="Чим це корисно другій стороні" className="min-h-[60px] rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
        <div className="flex gap-4 text-[13px] font-semibold text-dim">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.email} onChange={(e) => setF({ ...f, email: e.target.checked })} /> Передати email</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.phone} onChange={(e) => setF({ ...f, phone: e.target.checked })} /> Передати телефон</label>
        </div>
        {msg && <div className="text-[12.5px] font-semibold text-muted">{msg}</div>}
        <div className="flex gap-2">
          <button onClick={submit} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">{busy ? "Надсилаю…" : "Надіслати запит"}</button>
          <button onClick={() => setOpen(false)} className="rounded-full bg-panel2 px-5 py-2.5 text-[14px] font-bold text-dim">Скасувати</button>
        </div>
      </div>
    </div>
  );
}
