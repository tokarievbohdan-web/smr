"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const LABEL: Record<string, string> = {
  draft: "Чернетка", new: "Новий", under_review: "На розгляді", information_required: "Потрібна інформація",
  waiting_for_target_consent: "Очікуємо відповідь сторони", target_accepted: "Сторона погодилась", target_declined: "Сторона відмовилась",
  approved: "Схвалено", introduction_prepared: "Готується", introduction_sent: "Знайомство надіслано",
  follow_up_due: "Follow-up", closed: "Закрито", declined: "Відхилено", cancelled: "Скасовано",
};
type Intro = Record<string, unknown> & { id: string; status: string; subject: string; public_reason?: string; info_request?: string; target?: { display_name?: string }; target_org?: { name?: string }; requester?: { display_name?: string }; type?: { title_uk?: string } };

export default function IntroductionsPage() {
  const { ready, user, token } = useAuth();
  const [data, setData] = useState<{ requested: Intro[]; incoming: Intro[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() { const d = await apiFetch<{ requested: Intro[]; incoming: Intro[] }>("/api/introductions", { token }); setData(d); }
  useEffect(() => { if (ready && token) load().catch(() => setData({ requested: [], incoming: [] })); }, [ready, token]);

  async function act(path: string, body?: unknown) { try { await apiFetch(path, { method: "POST", token, body }); await load(); } catch (e) { setMsg(`Помилка: ${(e as { code?: string }).code ?? ""}`); } }

  if (!ready) return <div className="mx-auto max-w-[820px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[820px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб бачити знайомства</div>;

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-6 text-[28px] font-extrabold tracking-tight">Знайомства</h1>
      {msg && <div className="mb-4 rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}

      {data?.incoming && data.incoming.length > 0 && (
        <section className="mb-10"><h2 className="mb-3 text-[16px] font-extrabold">Запити до вас</h2>
          <div className="flex flex-col gap-3">{data.incoming.map((i) => <IncomingCard key={i.id} i={i} act={act} token={token} />)}</div>
        </section>
      )}

      <section><h2 className="mb-3 text-[16px] font-extrabold">Мої запити</h2>
        {data && data.requested.length === 0 ? (
          <div className="rounded-3xl bg-panel p-10 text-center text-[15px] text-muted">Ви ще не надсилали запитів на знайомство.</div>
        ) : (
          <div className="flex flex-col gap-3">{(data?.requested ?? []).map((i) => <RequestCard key={i.id} i={i} act={act} token={token} />)}</div>
        )}
      </section>
    </div>
  );
}

function Head({ i }: { i: Intro }) {
  const targetName = i.target?.display_name || i.target_org?.name || i.requester?.display_name || "—";
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><div className="text-[15px] font-extrabold leading-snug">{i.subject}</div>
        <div className="mt-0.5 text-[12.5px] font-semibold text-muted">{[i.type?.title_uk, targetName].filter(Boolean).join(" · ")}</div></div>
      <span className="shrink-0 rounded-full bg-panel2 px-3 py-1 text-[12px] font-bold text-dim">{LABEL[i.status] ?? i.status}</span>
    </div>
  );
}

function Contacts({ id, token }: { id: string; token: string | null }) {
  const [c, setC] = useState<{ email?: string; phone?: string } | null>(null);
  return c ? (
    <div className="mt-2 text-[13px] font-semibold text-accent">{[c.email, c.phone].filter(Boolean).join(" · ") || "Контакти не передано"}</div>
  ) : (
    <button onClick={async () => { try { setC(await apiFetch("/api/introductions/" + id + "/contacts", { token })); } catch { setC({}); } }} className="mt-2 text-[12.5px] font-bold text-accent">Показати контакти</button>
  );
}

function RequestCard({ i, act, token }: { i: Intro; act: (p: string, b?: unknown) => void; token: string | null }) {
  const [resp, setResp] = useState("");
  const cancelable = ["draft", "new", "under_review", "information_required", "waiting_for_target_consent"].includes(i.status);
  const sent = ["introduction_sent", "follow_up_due", "closed"].includes(i.status);
  return (
    <div className="rounded-2xl bg-panel p-5">
      <Head i={i} />
      {i.status === "declined" && i.public_reason && <div className="mt-2 text-[13px] text-muted">Причина: {i.public_reason}</div>}
      {i.status === "information_required" && (
        <div className="mt-3">
          {i.info_request && <div className="mb-2 text-[13px] font-semibold text-dim">Запит: {i.info_request}</div>}
          <textarea value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Ваша відповідь" className="min-h-[70px] w-full rounded-xl bg-panel2 px-3 py-2 text-[14px] outline-none" />
          <button onClick={() => act(`/api/introductions/${i.id}/information`, { response: resp })} className="mt-2 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white">Надіслати</button>
        </div>
      )}
      {sent && <Contacts id={i.id} token={token} />}
      <div className="mt-3 flex gap-2">
        {cancelable && <button onClick={() => act(`/api/introductions/${i.id}/cancel`)} className="text-[12.5px] font-bold text-muted hover:text-accent">Скасувати</button>}
        {sent && <button onClick={() => act(`/api/introductions/${i.id}/feedback`, { outcome: "contact_established", comment: "" })} className="text-[12.5px] font-bold text-muted hover:text-accent">Позначити: контакт встановлено</button>}
      </div>
    </div>
  );
}

function IncomingCard({ i, act, token }: { i: Intro; act: (p: string, b?: unknown) => void; token: string | null }) {
  const [email, setEmail] = useState(true);
  const [phone, setPhone] = useState(false);
  const sent = ["introduction_sent", "follow_up_due", "closed"].includes(i.status);
  return (
    <div className="rounded-2xl bg-panel p-5">
      <Head i={i} />
      {typeof i.context === "string" && <p className="mt-2 text-[13.5px] leading-relaxed text-ink/90">{i.context as string}</p>}
      {i.status === "waiting_for_target_consent" && (
        <div className="mt-3">
          <div className="flex gap-4 text-[13px] font-semibold text-dim">
            <label className="flex items-center gap-2"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Передати email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={phone} onChange={(e) => setPhone(e.target.checked)} /> Передати телефон</label>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => act(`/api/introductions/${i.id}/consent`, { accept: true, shareEmail: email, sharePhone: phone })} className="rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white">Погодитись</button>
            <button onClick={() => act(`/api/introductions/${i.id}/consent`, { accept: false })} className="rounded-full bg-panel2 px-4 py-2 text-[13px] font-bold text-dim">Відхилити</button>
          </div>
        </div>
      )}
      {sent && <Contacts id={i.id} token={token} />}
    </div>
  );
}
