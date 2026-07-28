import Link from "next/link";
import { ARTICLES, EVENTS, OPPS, PEOPLE } from "@/lib/data";
import { ArticleCard, DateBox } from "@/components/cards";
import { Badge, Thumb } from "@/components/ui";

export default function HomePage() {
  const featured = ARTICLES.find((a) => a.featured)!;
  const rest = ARTICLES.filter((a) => a.id !== featured.id);
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Головне сьогодні</h1>
          <p className="mt-1 text-[13.5px] font-medium text-dim">Персоналізована стрічка спортивного бізнесу</p>
        </div>
        <span className="text-[13px] font-bold text-accent">24 липня 2026</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-7">
          <Link href={`/review/${featured.id}`} className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-card shadow-card transition hover:shadow-cardlg sm:grid-cols-[1.15fr_1fr]">
            <Thumb className="min-h-[240px]" />
            <div className="p-6">
              <Badge tone="accent">{featured.category} · {featured.type}</Badge>
              <h2 className="mt-3 text-[24px] font-extrabold leading-tight tracking-tight text-balance">{featured.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-dim">{featured.subtitle}</p>
              <div className="mt-4 text-[12.5px] font-semibold text-muted">{featured.author} · {featured.readMin} хв читання · {featured.comments} коментарів</div>
            </div>
          </Link>

          <section>
            <div className="mb-3.5 flex items-baseline justify-between">
              <h2 className="text-[19px] font-extrabold tracking-tight">Свіжі матеріали</h2>
              <span className="text-[12.5px] font-bold text-accent">Уся стрічка →</span>
            </div>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((a) => <ArticleCard key={a.id} a={a} />)}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-[78px]">
          <Panel title="Найближчі події">
            {EVENTS.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 border-t border-line py-2.5 first:border-none">
                <DateBox day={e.day} month={e.month} />
                <div><div className="text-[13px] font-bold leading-snug">{e.title}</div><div className="mt-0.5 text-[11.5px] font-semibold text-muted">{e.org}</div></div>
              </Link>
            ))}
          </Panel>
          <Panel title="Нові можливості">
            {OPPS.slice(0, 3).map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="block border-t border-line py-3 first:border-none">
                <Badge tone={o.status[1]}>{o.type}</Badge>
                <div className="mt-1.5 text-[13px] font-bold leading-snug">{o.title}</div>
                <div className="mt-1 text-[11.5px] font-semibold text-muted">{o.org}</div>
              </Link>
            ))}
          </Panel>
          <Panel title="Рекомендовані фахівці">
            {PEOPLE.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-none">
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] bg-panel2 text-[13px] font-extrabold text-dim">{p.initials}</span>
                <div><div className="text-[13px] font-bold">{p.name}</div><div className="mt-0.5 text-[11.5px] font-semibold text-muted">{p.role.split(" · ").slice(0, 2).join(" · ")}</div></div>
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
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <h3 className="mb-2 text-[15px] font-extrabold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}
