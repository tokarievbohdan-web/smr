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
    <div className="mx-auto w-full max-w-[820px] px-4 pb-20 pt-6 md:px-8">
      <Link href="/opportunities" className="text-[13px] font-bold text-accent">← До можливостей</Link>
      <div className="mt-4 flex items-center gap-2"><Badge tone="accent">{o.type}</Badge><Badge tone={o.status[1]}>{o.status[0]}</Badge></div>
      <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-balance">{o.title}</h1>
      <div className="mt-2 flex items-center gap-1.5 text-[13.5px] font-bold text-dim">{o.org}{o.verified && <Verified size={14} />}</div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-panel2 p-3">
            <div className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted">{k}</div>
            <div className="mt-1 text-[13px] font-bold">{v}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[15.5px] leading-[1.7] text-ink/90">{o.desc}</p>
      <div className="mt-4 flex flex-wrap gap-1.5"><Tag>{o.sport}</Tag><Tag>{o.format}</Tag></div>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <button className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white sm:flex-1">Відгукнутися</button>
        <button className="rounded-xl border border-line2 bg-card px-5 py-3 text-sm font-bold sm:flex-1">Знайомство з організатором</button>
      </div>
    </div>
  );
}
