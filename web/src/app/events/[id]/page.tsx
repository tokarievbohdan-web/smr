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
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <Link href="/events" className="text-[13px] font-bold text-accent">← До подій</Link>
      <Thumb className="relative mt-6 aspect-[2.4/1] rounded-3xl" label="обкладинка події">
        <span className="absolute left-4 top-4"><Badge tone={e.format === "Онлайн" ? "neutral" : "accent"}>{e.format}</Badge></span>
      </Thumb>
      <h1 className="mt-7 text-[34px] font-extrabold leading-[1.08] tracking-tight">{e.title}</h1>
      <div className="mt-3 text-[15px] font-bold text-dim">{e.org}</div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-panel p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{k}</div>
            <div className="mt-1.5 text-[14px] font-bold">{v}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[17px] leading-[1.75] text-ink/90">{e.desc}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button className="rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 sm:flex-1">{full ? "У список очікування" : "Зареєструватися"}</button>
        <button className="rounded-xl bg-panel2 px-5 py-3.5 text-sm font-bold transition hover:brightness-95 sm:flex-1">У календар</button>
      </div>
    </div>
  );
}
