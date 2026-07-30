import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { opportunityDetail } from "@/lib/oppData";
import { Badge } from "@/components/ui";
import { ApplyButton } from "@/components/opp/ApplyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = await opportunityDetail(slug);
  if (!o) return { title: "Можливість не знайдено — SMR" };
  return { title: `${o.title} — Sport Market Review`, description: o.shortDesc ?? undefined, openGraph: { title: o.title, description: o.shortDesc ?? undefined, type: "article" } };
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = await opportunityDetail(slug);
  if (!o) return notFound();
  const chips = (title: string, arr: string[]) => arr.length > 0 && (
    <div className="mt-6"><h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      <div className="flex flex-wrap gap-2">{arr.map((s) => <span key={s} className="rounded-full bg-panel px-3 py-1.5 text-[13px] font-semibold text-dim">{s}</span>)}</div></div>
  );
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: o.title, description: o.shortDesc ?? undefined, datePosted: o.publishedAt ?? undefined, validThrough: o.expiration ?? undefined, hiringOrganization: o.orgName ? { "@type": "Organization", name: o.orgName } : undefined };

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/opportunities" className="text-[13px] font-bold text-accent">← До можливостей</Link>
      <div className="mt-6"><Badge tone="accent">{o.typeTitle}</Badge></div>
      <h1 className="mt-4 text-[36px] font-extrabold leading-[1.08] tracking-tight">{o.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] font-semibold text-dim">
        {o.orgSlug ? <Link href={`/network/organizations/${o.orgSlug}`} className="flex items-center gap-1 hover:text-accent">{o.orgName}{o.orgVerified && <span className="text-accent">✓</span>}</Link> : <span>{o.orgName}</span>}
        {o.city && <span>· {[o.city, o.country].filter(Boolean).join(", ")}</span>}
        {o.remote && <span>· {o.remote}</span>}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-2xl bg-panel px-4 py-3"><div className="text-[11.5px] font-bold uppercase text-muted">Бюджет</div><div className="mt-0.5 text-[14px] font-bold">{o.budget}</div></div>
        {o.deadline && <div className="rounded-2xl bg-panel px-4 py-3"><div className="text-[11.5px] font-bold uppercase text-muted">Дедлайн</div><div className="mt-0.5 text-[14px] font-bold">{o.deadline}</div></div>}
        {o.expectedFormat && <div className="rounded-2xl bg-panel px-4 py-3"><div className="text-[11.5px] font-bold uppercase text-muted">Формат</div><div className="mt-0.5 text-[14px] font-bold">{o.expectedFormat}</div></div>}
      </div>

      {o.fullDesc && <div className="mt-8 whitespace-pre-line text-[16px] leading-[1.75] text-ink/90">{o.fullDesc}</div>}
      {chips("Спорт", o.sports)}
      {chips("Категорії", o.categories)}
      {chips("Теги", o.tags)}

      <div className="mt-10"><ApplyButton oppId={o.id} applicationMethod={o.applicationMethod} externalUrl={o.externalUrl} /></div>
    </div>
  );
}
