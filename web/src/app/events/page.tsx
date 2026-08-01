import Link from "next/link";
import type { Metadata } from "next";
import { listEvents } from "@/lib/eventData";
import { Cover } from "@/components/Cover";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Події — Sport Market Review", description: "Галузеві події спортивного бізнесу: конференції, форуми, вебінари, нетворкінг, воркшопи." };

const FORMATS: [string, string][] = [["", "Усі"], ["offline", "Офлайн"], ["online", "Онлайн"], ["hybrid", "Гібрид"], ["deadline_only", "Дедлайни"]];

function fmtDate(iso: string | null, tz: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz ?? "Europe/Kyiv" }).format(new Date(iso));
  } catch { return ""; }
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const past = sp.scope === "past";
  const { items } = await listEvents({
    search: sp.q ?? null, format: sp.format ?? null, city: sp.city ?? null,
    free: sp.free === "1", online: sp.online === "1", verified: sp.verified === "1",
    timeframe: sp.timeframe ?? null, scope: sp.scope ?? null, sort: sp.sort ?? null, limit: 48,
  });
  const qs = (patch: Record<string, string | undefined>) => {
    const m = new URLSearchParams(); const merged = { format: sp.format, scope: sp.scope, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) m.set(k, v);
    const s = m.toString(); return `/events${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Події</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Форуми, воркшопи та нетворкінг спортивного бізнесу</p>
        </div>
        <Link href="/events/new" className="rounded-full bg-accent px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:opacity-90">+ Створити подію</Link>
      </div>

      <form className="mt-8 flex flex-wrap gap-2" action="/events">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Пошук події…" className="min-w-[220px] flex-1 rounded-xl bg-panel px-4 py-2.5 text-[14px] outline-none" />
        {sp.format && <input type="hidden" name="format" value={sp.format} />}
        {sp.scope && <input type="hidden" name="scope" value={sp.scope} />}
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FORMATS.map(([v, l]) => (
          <Link key={v} href={qs({ format: v || undefined })} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${((sp.format ?? "") === v) ? "bg-ink text-ground" : "bg-panel text-dim hover:text-ink"}`}>{l}</Link>
        ))}
        <span className="mx-1 h-4 w-px bg-panel2" />
        <Link href={qs({ scope: undefined })} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${!past ? "bg-ink text-ground" : "bg-panel text-dim"}`}>Найближчі</Link>
        <Link href={qs({ scope: "past" })} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${past ? "bg-ink text-ground" : "bg-panel text-dim"}`}>Минулі</Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-16 rounded-3xl bg-panel p-12 text-center text-[15px] text-muted">Подій не знайдено.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <Link key={e.id} href={`/events/${e.slug}`} className="group flex flex-col">
              <Cover src={e.cover} className="aspect-[2.2/1] w-full rounded-2xl" label="" />
              <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-muted">
                <span className={`rounded-full px-2.5 py-1 ${e.formatKind === "online" ? "bg-panel2 text-dim" : "bg-accent/15 text-accent"}`}>{e.format}</span>
                {e.typeTitle && <span>{e.typeTitle}</span>}
                {e.businessStatus === "cancelled" && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-500">Скасовано</span>}
                {e.businessStatus === "postponed" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600">Перенесено</span>}
              </div>
              <h3 className="mt-2 text-[18px] font-extrabold leading-snug tracking-tight group-hover:text-accent">{e.title}</h3>
              {e.startsAt && <div className="mt-1.5 text-[13px] font-bold text-dim">{fmtDate(e.startsAt, e.timezone)}</div>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-muted">
                <span className="flex items-center gap-1">{e.orgName}{e.orgVerified && <span className="text-accent">✓</span>}</span>
                {e.city && <span>· {e.city}</span>}
                <span className="ml-auto rounded-full bg-panel2 px-2.5 py-1 text-[11.5px]">{e.ticket}</span>
                <span className="rounded-full bg-panel2 px-2.5 py-1 text-[11.5px]">{e.spots}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
