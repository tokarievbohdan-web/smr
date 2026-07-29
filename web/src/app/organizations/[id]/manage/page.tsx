"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

type Org = Record<string, unknown> & { id: string; version?: number; moderation?: string; verification?: string; slug?: string };
type Member = { user_id: string; role: string; status: string; job_title?: string; profile?: { display_name?: string } };
type Req = { id: string; user_id: string; requested_role: string; job_title?: string; reason?: string; status: string };

const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(", ") : "");
const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ManageOrgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, user, token } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const d = await apiFetch<{ organization: Org; members: Member[]; accessRequests: Req[] }>(`/api/organizations/${id}/manage`, { token });
    setOrg(d.organization); setMembers(d.members); setReqs(d.accessRequests);
  }
  useEffect(() => { if (ready && token) load().catch(() => setMsg("Немає доступу до цієї організації")); }, [ready, token, id]);

  if (!ready) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть для керування</div>;
  if (msg && !org) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[15px] text-muted">{msg}</div>;
  if (!org) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;

  const set = (k: string, v: unknown) => setOrg({ ...org, [k]: v });
  async function save() {
    setMsg(null);
    try {
      const r = await apiFetch<{ version: number }>(`/api/organizations/${id}`, { method: "PATCH", token, body: {
        name: org!.name, short_desc: org!.short_desc, full_desc: org!.full_desc, city: org!.city, website: org!.website,
        sports: toArr(arr(org!.sports)), services: toArr(arr(org!.services)), expectedVersion: org!.version,
      } });
      setOrg({ ...org!, version: r.version }); setMsg("Збережено.");
    } catch (e) { const err = e as { code?: string }; setMsg(err.code === "conflict" ? "Змінено деінде — оновіть." : "Помилка збереження."); }
  }
  async function submit() { try { await apiFetch(`/api/organizations/${id}/submit`, { method: "POST", token }); await load(); setMsg("Надіслано на модерацію."); } catch { setMsg("Помилка."); } }
  async function review(rid: string, action: string) { try { await apiFetch(`/api/organizations/access-requests/${rid}/review`, { method: "POST", token, body: { action } }); await load(); } catch { setMsg("Помилка розгляду."); } }
  async function setRole(uid: string, role: string) { try { await apiFetch(`/api/organizations/${id}/members/${uid}`, { method: "PATCH", token, body: { role } }); await load(); } catch { setMsg("Помилка ролі."); } }

  const F = (label: string, k: string, ta = false) => (
    <div><label className="mb-1 block text-[12.5px] font-bold text-muted">{label}</label>
      {ta ? <textarea value={(org![k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} className="min-h-[90px] w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" />
          : <input value={(org![k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" />}</div>
  );

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">{(org.name as string) || "Організація"}</h1>
        <div className="flex gap-2 text-[12px] font-bold">
          <span className="rounded-full bg-panel px-3 py-1 text-dim">модерація: {org.moderation}</span>
          <span className="rounded-full bg-panel px-3 py-1 text-dim">верифікація: {org.verification}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {F("Назва", "name")}{F("Короткий опис", "short_desc", true)}{F("Повний опис", "full_desc", true)}
        <div className="grid grid-cols-2 gap-4">{F("Місто", "city")}{F("Вебсайт", "website")}</div>
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Спорт (через кому)</label>
          <input defaultValue={arr(org.sports)} onBlur={(e) => set("sports", toArr(e.target.value))} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Послуги (через кому)</label>
          <input defaultValue={arr(org.services)} onBlur={(e) => set("services", toArr(e.target.value))} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
        <div className="flex flex-wrap gap-2.5">
          <button onClick={save} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white">Зберегти</button>
          {(org.moderation === "draft" || org.moderation === "changes_required") && <button onClick={submit} className="rounded-full bg-panel px-5 py-2.5 text-[14px] font-bold text-dim">Надіслати на модерацію</button>}
          {org.moderation === "approved" && org.slug && <Link href={`/network/organizations/${org.slug}`} className="self-center text-[13px] font-bold text-accent">Публічна сторінка →</Link>}
        </div>
      </div>

      {reqs.filter((r) => r.status === "pending" || r.status === "under_review" || r.status === "information_required").length > 0 && (
        <div className="mt-10"><h2 className="mb-3 text-[16px] font-extrabold">Запити доступу</h2>
          <div className="flex flex-col gap-2">{reqs.filter((r) => ["pending", "under_review", "information_required"].includes(r.status)).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-panel p-4">
              <div className="min-w-0 flex-1"><div className="text-[14px] font-bold">{r.job_title || "Учасник"} · {r.requested_role}</div><div className="truncate text-[12.5px] text-muted">{r.reason}</div></div>
              <button onClick={() => review(r.id, "approve")} className="rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-bold text-white">Прийняти</button>
              <button onClick={() => review(r.id, "reject")} className="rounded-full bg-panel2 px-3.5 py-1.5 text-[12.5px] font-bold text-dim">Відхилити</button>
            </div>
          ))}</div></div>
      )}

      <div className="mt-10"><h2 className="mb-3 text-[16px] font-extrabold">Команда</h2>
        <div className="flex flex-col gap-2">{members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-panel p-3">
            <div className="min-w-0 flex-1"><div className="text-[14px] font-bold">{m.profile?.display_name ?? "Учасник"}</div><div className="text-[12px] text-muted">{m.job_title ?? ""}</div></div>
            <select value={m.role} onChange={(e) => setRole(m.user_id, e.target.value)} className="rounded-lg bg-panel2 px-2 py-1 text-[12.5px] font-semibold">
              <option value="owner">owner</option><option value="manager">manager</option><option value="editor">editor</option><option value="member">member</option></select>
          </div>
        ))}</div></div>
    </div>
  );
}
