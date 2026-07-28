import Link from "next/link";
import type { Article, Person, Org, Opportunity, EventItem } from "@/lib/data";
import { Badge, Tag, Verified, Avatar, Thumb } from "@/components/ui";

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link href={`/review/${a.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition hover:-translate-y-0.5 hover:border-line2 hover:shadow-cardlg">
      <Thumb label="фото" className="aspect-video" />
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-accent">{a.category}</span>
        <h3 className="text-[15.5px] font-bold leading-snug tracking-tight">{a.title}</h3>
        <div className="mt-1 text-xs font-semibold text-muted">{a.type} · {a.readMin} хв · {a.comments} коментарів</div>
      </div>
    </Link>
  );
}

export function PersonCard({ p }: { p: Person }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-[18px] shadow-card">
      <div className="flex items-center gap-3">
        <Avatar initials={p.initials} />
        <div>
          <div className="flex items-center gap-1.5 text-[15px] font-bold">{p.name}{p.verified && <Verified />}</div>
          <div className="mt-0.5 text-xs font-semibold leading-snug text-dim">{p.role}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.availability.map((x) => <span key={x} className="rounded-full bg-accentsoft px-2.5 py-1 text-[11px] font-bold text-accentink">{x}</span>)}
      </div>
      <div className="mt-0.5 flex gap-2">
        <button className="flex-1 rounded-[10px] bg-accent px-3.5 py-2.5 text-[12.5px] font-bold text-white">Знайомство</button>
        <button className="flex-1 rounded-[10px] border border-line2 bg-card px-3.5 py-2.5 text-[12.5px] font-bold">Профіль</button>
      </div>
    </article>
  );
}

export function OrgCard({ o }: { o: Org }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-[18px] shadow-card">
      <div className="flex items-center gap-3">
        <Avatar initials={o.initials} org />
        <div>
          <div className="flex items-center gap-1.5 text-[15px] font-bold">{o.name}{o.verified && <Verified />}</div>
          <div className="mt-0.5 text-xs font-semibold text-dim">{o.type} · {o.city}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">{o.sports.map((s) => <Tag key={s}>{s}</Tag>)}</div>
      <div className="mt-0.5 flex gap-2">
        <button className="flex-1 rounded-[10px] bg-accent px-3.5 py-2.5 text-[12.5px] font-bold text-white">Партнерство</button>
        <button className="flex-1 rounded-[10px] border border-line2 bg-card px-3.5 py-2.5 text-[12.5px] font-bold">Профіль</button>
      </div>
    </article>
  );
}

export function OppCard({ o }: { o: Opportunity }) {
  return (
    <Link href={`/opportunities/${o.id}`} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-[18px] shadow-card transition hover:-translate-y-0.5 hover:border-line2 hover:shadow-cardlg">
      <div className="flex items-center gap-2">
        <Badge tone="accent">{o.type}</Badge>
        <Badge tone={o.status[1]}>{o.status[0]}</Badge>
      </div>
      <h3 className="text-[16.5px] font-extrabold leading-tight tracking-tight">{o.title}</h3>
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-dim">{o.org}{o.verified && <Verified size={13} />}</div>
      <div className="flex flex-wrap gap-1.5"><Tag>{o.sport}</Tag><Tag>{o.format}</Tag></div>
      <div className="mt-0.5 flex flex-wrap gap-4 text-[12.5px] font-semibold text-dim">
        <span>💼 <b className="text-ink">{o.budget}</b></span>
        {o.deadline !== "—" && <span>до {o.deadline}</span>}
        <span className="tabnums">{o.apps} відгуків</span>
      </div>
    </Link>
  );
}

export function EventCard({ e }: { e: EventItem }) {
  return (
    <Link href={`/events/${e.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition hover:-translate-y-0.5 hover:border-line2 hover:shadow-cardlg">
      <Thumb label="обкладинка події" className="relative aspect-[2/1]">
        <span className="absolute left-3 top-3"><Badge tone={e.format === "Онлайн" ? "neutral" : "accent"}>{e.format}</Badge></span>
      </Thumb>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-3">
          <DateBox day={e.day} month={e.month} />
          <div>
            <h3 className="text-[16px] font-extrabold leading-tight tracking-tight">{e.title}</h3>
            <div className="mt-1 text-[12.5px] font-semibold text-dim">{e.org}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[12.5px] font-bold text-dim">
          <span>🎟 {e.cost}</span><span>{e.seats === "немає" ? "Немає місць" : e.seats}</span>
        </div>
      </div>
    </Link>
  );
}

export function DateBox({ day, month }: { day: string; month: string }) {
  return (
    <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[10px] bg-accentsoft text-center leading-none text-accentink">
      <b className="text-base font-extrabold tabnums">{day}</b>
      <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide">{month}</span>
    </div>
  );
}
