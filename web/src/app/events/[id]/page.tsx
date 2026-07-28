import Link from "next/link";
import { notFound } from "next/navigation";
import { findEvent, EVENTS } from "@/lib/data";
import { Badge, Thumb } from "@/components/ui";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = findEvent(id);
  if (!e) return notFound();
  const full = e.seats === "немає";
  const facts: [string, string][] = [
    ["Дата", `${e.day} ${e.month}`], ["Формат", e.format], ["Місто", e.city],
    ["Вартість", e.cost], ["Місця", full ? "немає" : e.seats],
  ];
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-20 pt-6 md:px-8">
      <Link href="/events" className="text-[13px] font-bold text-accent">← До подій</Link>
      <Thumb className="relative mt-4 aspect-[2.4/1] rounded-2xl" label="обкладинка події">
        <span className="absolute left-4 top-4"><Badge tone={e.format === "Онлайн" ? "neutral" : "accent"}>{e.format}</Badge></span>
      </Thumb>
      <h1 className="mt-5 text-[28px] font-extrabold leading-tight tracking-tight text-balance">{e.title}</h1>
      <div className="mt-2 text-[13.5px] font-bold text-dim">{e.org}</div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-panel2 p-3">
            <div className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted">{k}</div>
            <div className="mt-1 text-[13px] font-bold">{v}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[15.5px] leading-[1.7] text-ink/90">{e.desc}</p>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <button className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white sm:flex-1">{full ? "У список очікування" : "Зареєструватися"}</button>
        <button className="rounded-xl border border-line2 bg-card px-5 py-3 text-sm font-bold sm:flex-1">У календар</button>
      </div>
    </div>
  );
}
