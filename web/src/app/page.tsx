import Link from "next/link";
import { ARTICLES, EVENTS, OPPS, PEOPLE } from "@/lib/data";
import { ArticleCard, DateBox } from "@/components/cards";
import { Badge, Thumb } from "@/components/ui";

export default function HomePage() {
  const featured = ARTICLES.find((a) => a.featured)!;
  const rest = ARTICLES.filter((a) => a.id !== featured.id);
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Головне сьогодні</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Персоналізована стрічка спортивного бізнесу</p>
        </div>
        <span className="text-[14px] font-bold text-accent">24 липня 2026</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-14">
          <Link href={`/review/${featured.id}`} className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-panel p-4 transition hover:bg-panel2 sm:grid-cols-[1.1fr_1fr] sm:p-5">
            <Thumb label="" className="min-h-[260px] rounded-2xl" />
            <div className="flex flex-col justify-center p-2 sm:p-4">
              <Badge tone="accent">{featured.category} · {featured.type}</Badge>
              <h2 className="mt-4 text-[30px] font-extrabold leading-[1.1] tracking-tight">{featured.title}</h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-dim">{featured.subtitle}</p>
              <div className="mt-6 text-[13px] font-semibold text-muted">{featured.author} · {featured.readMin} хв читання · {featured.comments} коментарів</div>
            </div>
          </Link>

          <section>
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="text-[24px] font-extrabold tracking-tight">Свіжі матеріали</h2>
              <span className="text-[13px] font-bold text-accent">Уся стрічка →</span>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((a) => <ArticleCard key={a.id} a={a} />)}
            </div>
          </section>
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
