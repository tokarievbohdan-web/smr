import Link from "next/link";
import type { Metadata } from "next";
import { peopleDirectory } from "@/lib/networkData";
import { NetworkTabs } from "@/components/NetworkTabs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Люди — Мережа SMR", description: "Довідник фахівців спортивного бізнесу України." };

export default async function PeopleDirectory({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { items } = await peopleDirectory({ search: sp.q ?? null, verified: sp.verified === "1", city: sp.city ?? null, limit: 40 });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Мережа</h1>
      <p className="mt-3 text-[15px] font-medium text-dim">Структурований довідник учасників індустрії</p>
      <div className="mt-8"><NetworkTabs active="people" /></div>
      <form className="mb-8 flex flex-wrap gap-2" action="/network/people">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Пошук за імʼям, посадою…" className="min-w-[220px] flex-1 rounded-xl bg-panel px-4 py-2.5 text-[14px] outline-none" />
        <Link href={sp.verified === "1" ? "/network/people" : "/network/people?verified=1"} className={`rounded-xl px-4 py-2.5 text-[13px] font-bold ${sp.verified === "1" ? "bg-accent text-white" : "bg-panel text-dim"}`}>Лише верифіковані</Link>
      </form>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-12 text-center text-[15px] text-muted">Нікого не знайдено</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Link key={p.id} href={`/network/people/${p.id}`} className="flex flex-col rounded-2xl bg-panel p-5 transition hover:bg-panel2">
              <div className="flex items-center gap-3">
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-panel2 text-[14px] font-extrabold text-dim">{p.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">{p.displayName}{p.verified && <span className="text-accent" title="Верифіковано">✓</span>}</div>
                  {p.headline && <div className="truncate text-[12.5px] font-semibold text-muted">{p.headline}</div>}
                </div>
              </div>
              {p.competencies.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.competencies.slice(0, 3).map((c) => <span key={c} className="rounded-full bg-panel2 px-2.5 py-1 text-[11.5px] font-semibold text-dim">{c}</span>)}</div>}
              {p.availability.length > 0 && <div className="mt-2 text-[12px] font-semibold text-accent">{p.availability[0]}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
