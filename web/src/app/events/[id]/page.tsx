import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eventDetail } from "@/lib/eventData";
import { Cover } from "@/components/Cover";
import { EventRegister } from "@/components/event/EventRegister";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = await eventDetail(id);
  if (!e) return { title: "Подію не знайдено — SMR" };
  const noindex = e.businessStatus === "archived" || e.businessStatus === "draft";
  return { title: `${e.title} — Sport Market Review`, description: e.shortDesc ?? undefined, robots: noindex ? { index: false } : undefined };
}

function fmtRange(startsAt: string | null, endsAt: string | null, tz: string | null): string {
  if (!startsAt) return "";
  const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: tz ?? "Europe/Kyiv" };
  try {
    const s = new Intl.DateTimeFormat("uk-UA", opt).format(new Date(startsAt));
    const e = endsAt ? new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit", timeZone: tz ?? "Europe/Kyiv" }).format(new Date(endsAt)) : "";
    return e ? `${s} – ${e}` : s;
  } catch { return ""; }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await eventDetail(id);
  if (!e) return notFound();
  const spotsLeft = e.capacity == null ? null : Math.max(e.capacity - e.registeredCount, 0);

  const ld = {
    "@context": "https://schema.org", "@type": "Event", name: e.title,
    startDate: e.startsAt ?? undefined, endDate: e.endsAt ?? undefined,
    eventAttendanceMode: e.formatKind === "online" ? "https://schema.org/OnlineEventAttendanceMode" : e.formatKind === "hybrid" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: e.businessStatus === "cancelled" ? "https://schema.org/EventCancelled" : e.businessStatus === "postponed" ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled",
    location: e.formatKind === "online" ? { "@type": "VirtualLocation", url: e.onlinePublicUrl ?? undefined } : { "@type": "Place", name: e.venueName ?? undefined, address: [e.address, e.city, e.country].filter(Boolean).join(", ") },
    organizer: e.orgName ? { "@type": "Organization", name: e.orgName } : undefined,
    offers: e.ticketType === "paid_external" && e.externalTicketUrl ? { "@type": "Offer", url: e.externalTicketUrl, price: e.ticketPrice ?? undefined } : undefined,
  };

  const facts: [string, string][] = [
    ["Дата", fmtRange(e.startsAt, e.endsAt, e.timezone)], ["Формат", e.format],
    ...(e.city ? [["Місто", e.city] as [string, string]] : []),
    ...(e.venueName ? [["Майданчик", e.venueName] as [string, string]] : []),
    ["Вартість", e.ticketPrice ?? e.ticket], ["Місця", e.spots],
  ];

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/events" className="text-[13px] font-bold text-accent">← До подій</Link>
      <Cover src={e.cover} className="relative mt-6 aspect-[2.4/1] w-full rounded-3xl" label="" />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-muted">
        <span className={`rounded-full px-2.5 py-1 ${e.formatKind === "online" ? "bg-panel2 text-dim" : "bg-accent/15 text-accent"}`}>{e.format}</span>
        {e.typeTitle && <span>{e.typeTitle}</span>}
        {e.businessStatus === "cancelled" && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-500">Скасовано</span>}
        {e.businessStatus === "postponed" && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-600">Перенесено</span>}
      </div>

      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight">{e.title}</h1>
      <div className="mt-2 text-[15px] font-bold text-dim">{e.orgName}{e.orgVerified && <span className="text-accent"> ✓</span>}</div>

      {e.businessStatus === "cancelled" && e.publicCancelReason && (
        <div className="mt-5 rounded-2xl bg-red-500/10 p-4 text-[14px] font-semibold text-red-600">Подію скасовано: {e.publicCancelReason}</div>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-panel p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{k}</div>
            <div className="mt-1.5 text-[14px] font-bold">{v || "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-panel p-5">
        <EventRegister eventId={e.id} businessStatus={e.businessStatus} registrationMode={e.registrationMode} ticketType={e.ticketType} externalUrl={e.externalTicketUrl} waitlistEnabled={e.waitlistEnabled} spotsLeft={spotsLeft} />
      </div>

      {e.fullDesc && <p className="mt-9 whitespace-pre-wrap text-[16px] leading-[1.75] text-ink/90">{e.fullDesc}</p>}

      {e.schedule.length > 0 && (
        <section className="mt-10"><h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Програма</h2>
          <div className="flex flex-col gap-2">{e.schedule.map((s) => (
            <div key={s.id as string} className="rounded-2xl bg-panel p-4">
              <div className="text-[14px] font-bold">{s.title as string}</div>
              {(s.description as string) && <div className="mt-1 text-[13px] text-dim">{s.description as string}</div>}
            </div>
          ))}</div></section>
      )}

      {e.speakers.length > 0 && (
        <section className="mt-10"><h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Спікери</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{e.speakers.map((s) => (
            <div key={s.id as string} className="rounded-2xl bg-panel p-4">
              <div className="text-[14px] font-bold">{s.name as string}</div>
              <div className="text-[12.5px] font-semibold text-muted">{[s.headline, s.organization_name].filter(Boolean).join(" · ")}</div>
            </div>
          ))}</div></section>
      )}

      {e.partners.length > 0 && (
        <section className="mt-10"><h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Партнери</h2>
          <div className="flex flex-wrap gap-2">{e.partners.map((s) => (
            <span key={s.id as string} className="rounded-full bg-panel px-3 py-1.5 text-[13px] font-semibold text-dim">{s.name as string}</span>
          ))}</div></section>
      )}

      {e.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">{e.tags.map((t) => <span key={t} className="rounded-full bg-panel px-3 py-1.5 text-[12.5px] font-semibold text-muted">#{t}</span>)}</div>
      )}
    </div>
  );
}
