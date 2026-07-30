import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orgDetail } from "@/lib/networkData";
import { Cover } from "@/components/Cover";
import { IntroduceButton } from "@/components/intro/IntroduceButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = await orgDetail(slug);
  if (!o) return { title: "Організацію не знайдено — SMR" };
  return { title: `${o.name} — Sport Market Review`, description: o.shortDesc ?? undefined };
}

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = await orgDetail(slug);
  if (!o) return notFound();
  const ld = { "@context": "https://schema.org", "@type": "Organization", name: o.name, url: o.website ?? undefined, address: o.city ?? undefined };
  const chips = (title: string, arr: string[]) => arr.length > 0 && (
    <div className="mt-6"><h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      <div className="flex flex-wrap gap-2">{arr.map((s) => <span key={s} className="rounded-full bg-panel px-3 py-1.5 text-[13px] font-semibold text-dim">{s}</span>)}</div></div>
  );
  const team = o.team as { user_id: string; role: string; job_title?: string; profile?: { display_name?: string; avatar?: string } }[];

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pb-24 pt-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/network/organizations" className="text-[13px] font-bold text-accent">← До мережі</Link>
      <Cover src={o.cover} className="mt-6 aspect-[3/1] w-full rounded-3xl" label="" />
      <div className="mt-6 flex items-center gap-4">
        {o.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.logo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-panel2 text-[20px] font-extrabold text-dim">{o.name.slice(0, 2).toUpperCase()}</span>
        )}
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-extrabold tracking-tight">{o.name}{o.verified && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[12px] font-bold text-accent">✓ Верифіковано</span>}</h1>
          <p className="mt-1 text-[13px] font-semibold text-muted">{[o.typeTitle, o.city, o.country].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      {o.shortDesc && <p className="mt-6 text-[16px] leading-relaxed text-dim">{o.shortDesc}</p>}
      {o.fullDesc && <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{o.fullDesc}</p>}
      {chips("Спорт", o.sports)}
      {chips("Послуги", o.services)}
      {chips("Комерційні напрями", o.commercialDirections)}
      {chips("Партнери", o.partners)}

      <div className="mt-8"><IntroduceButton targetOrganizationId={o.id} /></div>

      {team.length > 0 && (
        <div className="mt-8"><h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Команда</h2>
          <div className="flex flex-col gap-2">{team.map((m) => (
            <Link key={m.user_id} href={`/network/people/${m.user_id}`} className="flex items-center gap-3 rounded-2xl bg-panel p-3 transition hover:bg-panel2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel2 text-[12px] font-extrabold text-dim">{(m.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}</span>
              <div><div className="text-[14px] font-bold">{m.profile?.display_name ?? "Учасник"}</div><div className="text-[12px] font-semibold text-muted">{m.job_title ?? m.role}</div></div>
            </Link>
          ))}</div></div>
      )}

      {(o.publicEmail || o.website) && (
        <div className="mt-8"><h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">Контакти</h2>
          <div className="flex flex-col gap-1 text-[14px]">
            {o.publicEmail && <a href={`mailto:${o.publicEmail}`} className="font-semibold text-accent">{o.publicEmail}</a>}
            {o.website && <a href={o.website} className="font-semibold text-accent" target="_blank" rel="noreferrer">{o.website}</a>}
          </div></div>
      )}
    </div>
  );
}
