"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const LABEL: Record<string, string> = {
  pending: "Очікує підтвердження", registered: "Зареєстровано", waitlisted: "Список очікування",
  attended: "Відвідано", invited: "Запрошено", rejected: "Відхилено", cancelled: "Скасовано",
};
type Row = { id: string; status: string; promotion_status?: string; event: { id: string; slug: string; title: string; starts_at: string | null; timezone: string | null; city: string | null; format_kind: string; business_status: string } };

function fmt(iso: string | null, tz: string | null) {
  if (!iso) return "";
  try { return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz ?? "Europe/Kyiv" }).format(new Date(iso)); } catch { return ""; }
}

export default function MyEventsPage() {
  const { ready, user, token } = useAuth();
  const [items, setItems] = useState<Row[] | null>(null);

  useEffect(() => {
    if (ready && token) apiFetch<{ items: Row[] }>("/api/me/events", { token }).then((d) => setItems(d.items)).catch(() => setItems([]));
  }, [ready, token]);

  if (!ready) return <div className="mx-auto max-w-[820px] px-6 pt-10"><div className="h-40 animate-pulse rounded-2xl bg-panel" /></div>;
  if (!user) return <div className="mx-auto max-w-[820px] px-6 pt-16 text-center text-[16px] font-bold">Увійдіть, щоб бачити свої події</div>;

  const now = Date.now();
  const upcoming = (items ?? []).filter((r) => !r.event.starts_at || new Date(r.event.starts_at).getTime() >= now);
  const past = (items ?? []).filter((r) => r.event.starts_at && new Date(r.event.starts_at).getTime() < now);

  const Card = (r: Row) => (
    <Link key={r.id} href={`/events/${r.event.slug}`} className="flex items-center justify-between gap-3 rounded-2xl bg-panel p-4 transition hover:bg-panel2">
      <div className="min-w-0">
        <div className="truncate text-[15px] font-extrabold">{r.event.title}</div>
        <div className="mt-0.5 text-[12.5px] font-semibold text-muted">{[fmt(r.event.starts_at, r.event.timezone), r.event.city].filter(Boolean).join(" · ")}</div>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${r.status === "registered" || r.status === "attended" ? "bg-accent/15 text-accent" : "bg-panel2 text-dim"}`}>{LABEL[r.status] ?? r.status}</span>
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-6 text-[28px] font-extrabold tracking-tight">Мої події</h1>
      {items && items.length === 0 && <div className="rounded-3xl bg-panel p-10 text-center text-[15px] text-muted">Ви ще не реєструвались на події. <Link href="/events" className="font-bold text-accent">Знайти подію →</Link></div>}
      {upcoming.length > 0 && <section className="mb-8"><h2 className="mb-3 text-[16px] font-extrabold">Найближчі</h2><div className="flex flex-col gap-2">{upcoming.map(Card)}</div></section>}
      {past.length > 0 && <section><h2 className="mb-3 text-[16px] font-extrabold">Минулі</h2><div className="flex flex-col gap-2">{past.map(Card)}</div></section>}
    </div>
  );
}
