import Link from "next/link";
import type { Metadata } from "next";
import { orgDirectory } from "@/lib/networkData";
import { NetworkTabs } from "@/components/NetworkTabs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Організації — Мережа SMR", description: "Довідник організацій спортивного бізнесу України." };

export default async function OrgDirectory({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { items } = await orgDirectory({ search: sp.q ?? null, verified: sp.verified === "1", type: sp.type ?? null, limit: 40 });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Мережа</h1>
      <p className="mt-3 text-[15px] font-medium text-dim">Структурований довідник учасників індустрії</p>
      <div className="mt-8"><NetworkTabs active="orgs" /></div>
      <form className="mb-8 flex flex-wrap gap-2" action="/network/organizations">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Пошук організації…" className="min-w-[220px] flex-1 rounded-xl bg-panel px-4 py-2.5 text-[14px] outline-none" />
        <Link href={sp.verified === "1" ? "/network/organizations" : "/network/organizations?verified=1"} className={`rounded-xl px-4 py-2.5 text-[13px] font-bold ${sp.verified === "1" ? "bg-accent text-white" : "bg-panel text-dim"}`}>Лише верифіковані</Link>
        <Link href="/organizations/new" className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-white">+ Створити</Link>
      </form>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-12 text-center text-[15px] text-muted">Організацій не знайдено</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((o) => (
            <Link key={o.id} href={`/network/organizations/${o.slug}`} className="flex flex-col rounded-2xl bg-panel p-5 transition hover:bg-panel2">
              <div className="flex items-center gap-3">
                {o.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-panel2 text-[13px] font-extrabold text-dim">{o.name.slice(0, 2).toUpperCase()}</span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">{o.name}{o.verified && <span className="text-accent" title="Верифіковано">✓</span>}</div>
                  <div className="truncate text-[12.5px] font-semibold text-muted">{[o.typeTitle, o.city].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              {o.sports.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{o.sports.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-panel2 px-2.5 py-1 text-[11.5px] font-semibold text-dim">{s}</span>)}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
