import Link from "next/link";
import { notFound } from "next/navigation";
import { findOpp, OPPS } from "@/lib/data";
import { Badge, Tag, Verified } from "@/components/ui";

export function generateStaticParams() {
  return OPPS.map((o) => ({ id: o.id }));
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = findOpp(id);
  if (!o) return notFound();
  const facts: [string, string][] = [
    ["Спорт", o.sport], ["Формат", o.format], ["Бюджет", o.budget],
    ["Дедлайн", o.deadline], ["Відгуків", String(o.apps)],
  ];
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <Link href="/opportunities" className="text-[13px] font-bold text-accent">← До можливостей</Link>
      <div className="mt-6 flex items-center gap-2"><Badge tone="accent">{o.type}</Badge><Badge tone={o.status[1]}>{o.status[0]}</Badge></div>
      <h1 className="mt-4 text-[34px] font-extrabold leading-[1.08] tracking-tight">{o.title}</h1>
      <div className="mt-3 flex items-center gap-1.5 text-[15px] font-bold text-dim">{o.org}{o.verified && <Verified size={14} />}</div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-panel p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{k}</div>
            <div className="mt-1.5 text-[14px] font-bold">{v}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[17px] leading-[1.75] text-ink/90">{o.desc}</p>
      <div className="mt-5 flex flex-wrap gap-2"><Tag>{o.sport}</Tag><Tag>{o.format}</Tag></div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button className="rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 sm:flex-1">Відгукнутися</button>
        <button className="rounded-xl bg-panel2 px-5 py-3.5 text-sm font-bold transition hover:brightness-95 sm:flex-1">Знайомство з організатором</button>
      </div>
    </div>
  );
}
