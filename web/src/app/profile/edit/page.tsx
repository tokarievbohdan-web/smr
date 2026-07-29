"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const AVAIL = [
  ["open_to_work", "Відкритий до роботи"], ["open_to_projects", "Відкритий до проєктів"],
  ["looking_for_partners", "Шукаю партнерів"], ["looking_for_investment", "Шукаю інвестиції"],
  ["available_as_speaker", "Готовий бути спікером"], ["not_looking", "Не розглядаю пропозиції"],
] as const;

type Profile = Record<string, unknown> & { version?: number; verification_status?: string };
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const csv = (v: unknown) => arr(v).join(", ");
const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProfileEditPage() {
  const { ready, user, token } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch<Profile>("/api/me/profile", { token }).then(setP).catch(() => setMsg("Не вдалося завантажити профіль"));
  }, [ready, token]);

  if (!ready) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[760px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб редагувати профіль</div>;
  if (!p) return <div className="mx-auto max-w-[760px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;

  const set = (k: string, v: unknown) => setP({ ...p, [k]: v });
  const toggleAvail = (code: string) => {
    let cur = arr(p.availability_statuses);
    cur = cur.includes(code) ? cur.filter((x) => x !== code) : (code === "not_looking" ? [code] : [...cur.filter((x) => x !== "not_looking"), code]);
    set("availability_statuses", cur);
  };

  async function save(submit = false) {
    if (!p) return;
    setBusy(true); setMsg(null);
    try {
      const patch = {
        first_name: p.first_name, last_name: p.last_name, display_name: p.display_name, headline: p.headline,
        current_position: p.current_position, city: p.city, region: p.region, country: p.country, bio: p.bio,
        website: p.website, linkedin_url: p.linkedin_url, public_email: p.public_email, public_phone: p.public_phone,
        contact_visibility: p.contact_visibility, profile_visibility: p.profile_visibility,
        sports: arr(p.sports), professional_categories: arr(p.professional_categories), skills: arr(p.skills),
        languages: arr(p.languages), availability_statuses: arr(p.availability_statuses),
        expectedVersion: p.version,
      };
      const r = await apiFetch<{ version: number }>("/api/me/profile", { method: "PATCH", token, body: patch });
      setP({ ...p, version: r.version });
      if (submit) {
        await apiFetch("/api/me/profile/submit-verification", { method: "POST", token });
        setMsg("Профіль надіслано на верифікацію.");
        setP((prev) => (prev ? { ...prev, verification_status: "pending" } : prev));
      } else setMsg("Збережено.");
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setMsg(err.code === "conflict" ? "Профіль змінено деінде — оновіть сторінку." : `Помилка: ${err.message ?? err.code ?? ""}`);
    } finally { setBusy(false); }
  }

  const F = (label: string, k: string, ph = "") => (
    <div><label className="mb-1 block text-[12.5px] font-bold text-muted">{label}</label>
      <input value={(p[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
  );
  const AR = (label: string, k: string) => (
    <div><label className="mb-1 block text-[12.5px] font-bold text-muted">{label} <span className="text-muted/60">(через кому)</span></label>
      <input defaultValue={csv(p[k])} onBlur={(e) => set(k, toArr(e.target.value))} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
  );

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold tracking-tight">Мій профіль</h1>
        <span className="rounded-full bg-panel px-3 py-1 text-[12px] font-bold text-dim">Верифікація: {String(p.verification_status ?? "unverified")}</span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">{F("Імʼя", "first_name")}{F("Прізвище", "last_name")}</div>
        {F("Відображуване імʼя", "display_name")}
        {F("Заголовок (headline)", "headline", "напр. Head of Sponsorship")}
        {F("Посада", "current_position")}
        <div className="grid grid-cols-3 gap-4">{F("Місто", "city")}{F("Регіон", "region")}{F("Країна", "country")}</div>
        <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Про себе</label>
          <textarea value={(p.bio as string) ?? ""} onChange={(e) => set("bio", e.target.value)} className="min-h-[120px] w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none" /></div>
        {AR("Спорт", "sports")}
        {AR("Проф. категорії", "professional_categories")}
        {AR("Навички", "skills")}
        {AR("Мови", "languages")}

        <div><label className="mb-2 block text-[12.5px] font-bold text-muted">Доступність</label>
          <div className="flex flex-wrap gap-2">{AVAIL.map(([code, lbl]) => (
            <button key={code} type="button" onClick={() => toggleAvail(code)} className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${arr(p.availability_statuses).includes(code) ? "bg-accent text-white" : "bg-panel text-dim"}`}>{lbl}</button>
          ))}</div></div>

        <div className="grid grid-cols-2 gap-4">{F("Публічний email", "public_email")}{F("Публічний телефон", "public_phone")}</div>
        <div className="grid grid-cols-2 gap-4">{F("Вебсайт", "website")}{F("LinkedIn", "linkedin_url")}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Видимість профілю</label>
            <select value={(p.profile_visibility as string) ?? "public"} onChange={(e) => set("profile_visibility", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none">
              <option value="public">Публічний</option><option value="authenticated_only">Лише авторизованим</option><option value="hidden">Прихований</option></select></div>
          <div><label className="mb-1 block text-[12.5px] font-bold text-muted">Видимість контактів</label>
            <select value={(p.contact_visibility as string) ?? "authenticated_only"} onChange={(e) => set("contact_visibility", e.target.value)} className="w-full rounded-xl bg-panel px-3.5 py-2.5 text-[14px] outline-none">
              <option value="public">Публічні</option><option value="authenticated_only">Авторизованим</option><option value="introduction_only">Через знайомство</option><option value="private">Приватні</option></select></div>
        </div>

        {msg && <div className="rounded-xl bg-panel p-3 text-[13px] font-semibold text-dim">{msg}</div>}
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => save(false)} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">Зберегти</button>
          <button onClick={() => save(true)} disabled={busy} className="rounded-full bg-panel px-5 py-2.5 text-[14px] font-bold text-dim disabled:opacity-60">Зберегти й надіслати на верифікацію</button>
          <Link href="/network/people" className="ml-auto self-center text-[13px] font-bold text-accent">До мережі →</Link>
        </div>
      </div>
    </div>
  );
}
