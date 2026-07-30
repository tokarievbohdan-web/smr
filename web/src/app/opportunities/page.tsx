import Link from "next/link";
import type { Metadata } from "next";
import { listOpportunities } from "@/lib/oppData";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Можливості — Sport Market Review", description: "Ділові запити спортивної індустрії: партнерства, спонсорство, вакансії, тендери." };

const TYPES: [string, string][] = [["", "Усі"], ["sponsorship", "Спонсорство"], ["partnership", "Партнерство"], ["vacancy", "Вакансія"], ["tender", "Тендер"], ["investment", "Інвестиції"]];

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { items } = await listOpportunities({ search: sp.q ?? null, type: sp.type ?? null, verified: sp.verified === "1", sort: sp.sort ?? null, limit: 40 });
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h1 className="text-[34px] font-extrabold leading-none tracking-tight">Можливості</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Структуровані ділові запити індустрії</p></div>
        <Link href="/opportunities/new" className="rounded-full bg-accent px-4 py-2.5 text-[13.5px] font-bold text-white">+ Створити</Link>
      </div>
      <form className="mb-6 flex flex-wrap gap-2" action="/opportunities">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Пошук можливості…" className="min-w-[220px] flex-1 rounded-xl bg-panel px-4 py-2.5 text-[14px] outline-none" />
        {sp.verified === "1" && <input type="hidden" name="verified" value="1" />}
      </form>
      <div className="mb-8 flex flex-wrap gap-2">
        {TYPES.map(([v, l]) => (
          <Link key={v} href={`/opportunities${v ? `?type=${v}` : ""}`} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${((sp.type ?? "") === v) ? "bg-white text-[#16181D] shadow-sm" : "bg-panel text-dim"}`}>{l}</Link>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-12 text-center text-[15px] text-muted">Можливостей не знайдено</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((o) => (
            <Link key={o.id} href={`/opportunities/${o.slug}`} className="flex flex-col rounded-2xl bg-panel p-5 transition hover:bg-panel2">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="accent">{o.typeTitle}</Badge>
                {o.deadline && <span className="text-[12px] font-semibold text-muted">до {o.deadline}</span>}
              </div>
              <h3 className="mt-3 text-[18px] font-extrabold leading-snug tracking-tight">{o.title}</h3>
              {o.shortDesc && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-dim">{o.shortDesc}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-muted">
                <span className="flex items-center gap-1">{o.orgName}{o.orgVerified && <span className="text-accent">✓</span>}</span>
                {o.city && <span>· {o.city}</span>}{o.remote && <span>· {o.remote}</span>}
                <span className="ml-auto rounded-full bg-panel2 px-2.5 py-1 text-[11.5px]">{o.budget}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
