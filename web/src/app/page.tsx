import Link from "next/link";
import { EVENTS, OPPS, PEOPLE } from "@/lib/data";
import { DateBox } from "@/components/cards";
import { Badge } from "@/components/ui";
import { Cover } from "@/components/Cover";
import { listReview } from "@/lib/reviewData";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { items } = await listReview({ limit: 12 });
  const featured = items.find((a) => a.featured) ?? items[0] ?? null;
  const rest = featured ? items.filter((a) => a.slug !== featured.slug) : items;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Головне сьогодні</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Персоналізована стрічка спортивного бізнесу</p>
        </div>
        <Link href="/review" className="text-[14px] font-bold text-accent">Уся стрічка →</Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-14">
          {featured ? (
            <Link href={`/review/${featured.slug}`} className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-panel p-4 transition hover:bg-panel2 sm:grid-cols-[1.1fr_1fr] sm:p-5">
              <Cover src={featured.cover} label="" className="min-h-[260px] w-full rounded-2xl" />
              <div className="flex flex-col justify-center p-2 sm:p-4">
                <Badge tone="accent">{[featured.categoryLabel, featured.typeLabel].filter(Boolean).join(" · ")}</Badge>
                <h2 className="mt-4 text-[30px] font-extrabold leading-[1.1] tracking-tight">{featured.title}</h2>
                {featured.subtitle && <p className="mt-4 text-[15.5px] leading-relaxed text-dim">{featured.subtitle}</p>}
                <div className="mt-6 text-[13px] font-semibold text-muted">{[featured.author, featured.readMin ? `${featured.readMin} хв читання` : null].filter(Boolean).join(" · ")}</div>
              </div>
            </Link>
          ) : (
            <div className="rounded-3xl bg-panel p-12 text-center text-[15px] text-muted">Матеріали зʼявляться тут після публікації.</div>
          )}

          {rest.length > 0 && (
            <section>
              <div className="mb-8 flex items-baseline justify-between">
                <h2 className="text-[24px] font-extrabold tracking-tight">Свіжі матеріали</h2>
                <Link href="/review" className="text-[13px] font-bold text-accent">Уся стрічка →</Link>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((a) => (
                  <Link key={a.slug} href={`/review/${a.slug}`} className="group flex flex-col">
                    <Cover src={a.cover} label="" className="mb-4 aspect-[16/10] w-full rounded-2xl" />
                    <Badge tone="neutral">{[a.categoryLabel, a.typeLabel].filter(Boolean).join(" · ")}</Badge>
                    <h3 className="mt-3 text-[18px] font-extrabold leading-snug tracking-tight group-hover:text-accent">{a.title}</h3>
                    {a.subtitle && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-dim">{a.subtitle}</p>}
                    <div className="mt-3 text-[12px] font-semibold text-muted">{[a.author, a.readMin ? `${a.readMin} хв` : null].filter(Boolean).join(" · ")}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-[84px]">
          <Panel title="Найближчі події">
            {EVENTS.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3.5 py-3.5">
                <DateBox day={e.day} month={e.month} />
                <div><div className="text-[13.5px] font-bold leading-snug">{e.title}</div><div className="mt-1 text-[12px] font-semibold text-muted">{e.org}</div></div>
              </Link>
            ))}
          </Panel>
          <Panel title="Нові можливості">
            {OPPS.slice(0, 3).map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="block py-3.5">
                <Badge tone={o.status[1]}>{o.type}</Badge>
                <div className="mt-2 text-[13.5px] font-bold leading-snug">{o.title}</div>
                <div className="mt-1 text-[12px] font-semibold text-muted">{o.org}</div>
              </Link>
            ))}
          </Panel>
          <Panel title="Рекомендовані фахівці">
            {PEOPLE.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3.5 py-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-panel2 text-[13px] font-extrabold text-dim">{p.initials}</span>
                <div><div className="text-[13.5px] font-bold">{p.name}</div><div className="mt-1 text-[12px] font-semibold text-muted">{p.role.split(" · ").slice(0, 2).join(" · ")}</div></div>
              </div>
            ))}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">{title}</h3>
      <div className="flex flex-col divide-y divide-line">{children}</div>
    </div>
  );
}
