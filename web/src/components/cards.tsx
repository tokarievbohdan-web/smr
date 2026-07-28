import Link from "next/link";
import type { Article, Person, Org, Opportunity, EventItem } from "@/lib/data";
import { Badge, Tag, Verified, Avatar, Thumb } from "@/components/ui";

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link href={`/review/${a.id}`} className="group flex flex-col gap-4">
      <Thumb label="" className="aspect-video rounded-2xl transition group-hover:opacity-90" />
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent">{a.category}</span>
        <h3 className="text-[19px] font-bold leading-[1.25] tracking-tight transition group-hover:text-accent">{a.title}</h3>
        <div className="text-[13px] font-semibold text-muted">{a.type} · {a.readMin} хв · {a.comments} коментарів</div>
      </div>
    </Link>
  );
}

export function PersonCard({ p }: { p: Person }) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-panel p-6 transition hover:bg-panel2">
      <div className="flex items-center gap-4">
        <Avatar initials={p.initials} size={56} />
        <div>
          <div className="flex items-center gap-1.5 text-[17px] font-bold tracking-tight">{p.name}{p.verified && <Verified size={16} />}</div>
          <div className="mt-1 text-[13px] font-semibold leading-snug text-dim">{p.role}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {p.availability.map((x) => <span key={x} className="rounded-full bg-accentsoft px-3 py-1.5 text-[12px] font-bold text-accentink">{x}</span>)}
      </div>
      <div className="mt-1 flex gap-2.5">
        <button className="flex-1 rounded-xl bg-accent px-4 py-3 text-[13px] font-bold text-white transition hover:opacity-90">Знайомство</button>
        <button className="flex-1 rounded-xl bg-panel2 px-4 py-3 text-[13px] font-bold transition hover:brightness-95">Профіль</button>
      </div>
    </article>
  );
}

export function OrgCard({ o }: { o: Org }) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-panel p-6 transition hover:bg-panel2">
      <div className="flex items-center gap-4">
        <Avatar initials={o.initials} size={56} org />
        <div>
          <div className="flex items-center gap-1.5 text-[17px] font-bold tracking-tight">{o.name}{o.verified && <Verified size={16} />}</div>
          <div className="mt-1 text-[13px] font-semibold text-dim">{o.type} · {o.city}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{o.sports.map((s) => <Tag key={s}>{s}</Tag>)}</div>
      <div className="mt-1 flex gap-2.5">
        <button className="flex-1 rounded-xl bg-accent px-4 py-3 text-[13px] font-bold text-white transition hover:opacity-90">Партнерство</button>
        <button className="flex-1 rounded-xl bg-panel2 px-4 py-3 text-[13px] font-bold transition hover:brightness-95">Профіль</button>
      </div>
    </article>
  );
}

export function OppCard({ o }: { o: Opportunity }) {
  return (
    <Link href={`/opportunities/${o.id}`} className="flex flex-col gap-3 rounded-3xl bg-panel p-6 transition hover:bg-panel2">
      <div className="flex items-center gap-2">
        <Badge tone="accent">{o.type}</Badge>
        <Badge tone={o.status[1]}>{o.status[0]}</Badge>
      </div>
      <h3 className="text-[19px] font-extrabold leading-tight tracking-tight">{o.title}</h3>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-dim">{o.org}{o.verified && <Verified size={13} />}</div>
      <div className="flex flex-wrap gap-2"><Tag>{o.sport}</Tag><Tag>{o.format}</Tag></div>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] font-semibold text-dim">
        <span>💼 <b className="text-ink">{o.budget}</b></span>
        {o.deadline !== "—" && <span>до {o.deadline}</span>}
        <span className="tabnums">{o.apps} відгуків</span>
      </div>
    </Link>
  );
}

export function EventCard({ e }: { e: EventItem }) {
  return (
    <Link href={`/events/${e.id}`} className="group flex flex-col gap-4">
      <Thumb label="" className="relative aspect-[2/1] rounded-2xl transition group-hover:opacity-90">
        <span className="absolute left-4 top-4"><Badge tone={e.format === "Онлайн" ? "neutral" : "accent"}>{e.format}</Badge></span>
      </Thumb>
      <div className="flex items-start gap-4">
        <DateBox day={e.day} month={e.month} />
        <div className="flex-1">
          <h3 className="text-[18px] font-extrabold leading-tight tracking-tight transition group-hover:text-accent">{e.title}</h3>
          <div className="mt-1.5 text-[13px] font-semibold text-dim">{e.org}</div>
          <div className="mt-3 flex items-center gap-5 text-[13px] font-bold text-dim">
            <span>🎟 {e.cost}</span><span>{e.seats === "немає" ? "Немає місць" : e.seats}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DateBox({ day, month }: { day: string; month: string }) {
  return (
    <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-accentsoft text-center leading-none text-accentink">
      <b className="text-[18px] font-extrabold tabnums">{day}</b>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{month}</span>
    </div>
  );
}
