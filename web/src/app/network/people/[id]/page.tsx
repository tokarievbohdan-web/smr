import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { personDetail } from "@/lib/networkData";
import { IntroduceButton } from "@/components/intro/IntroduceButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await personDetail(id);
  if (!p) return { title: "Профіль не знайдено — SMR" };
  return { title: `${p.displayName} — Sport Market Review`, description: p.headline ?? p.bio ?? undefined, robots: { index: true } };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await personDetail(id);
  if (!p) return notFound();
  const ld = { "@context": "https://schema.org", "@type": "Person", name: p.displayName, jobTitle: p.currentPosition ?? p.headline ?? undefined, address: p.city ?? undefined };

  const chips = (title: string, arr: string[]) => arr.length > 0 && (
    <div className="mt-6"><h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      <div className="flex flex-wrap gap-2">{arr.map((s) => <span key={s} className="rounded-full bg-panel px-3 py-1.5 text-[13px] font-semibold text-dim">{s}</span>)}</div></div>
  );

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/network/people" className="text-[13px] font-bold text-accent">← До мережі</Link>
      <div className="mt-6 flex items-center gap-4">
        {p.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar} alt="" className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-panel2 text-[22px] font-extrabold text-dim">{p.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
        )}
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-extrabold tracking-tight">{p.displayName}{p.verified && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[12px] font-bold text-accent">✓ Верифіковано</span>}</h1>
          {p.headline && <p className="mt-1 text-[15px] text-dim">{p.headline}</p>}
          {(p.city || p.country) && <p className="mt-1 text-[13px] font-semibold text-muted">{[p.city, p.region, p.country].filter(Boolean).join(", ")}</p>}
        </div>
      </div>

      {p.bio && <p className="mt-8 text-[16px] leading-relaxed text-ink/90">{p.bio}</p>}
      {chips("Компетенції", p.categories)}
      {chips("Навички", p.skills)}
      {chips("Спорт", p.sports)}
      {chips("Доступність", p.availability)}

      {(p.publicEmail || p.website || p.linkedin) && (
        <div className="mt-8"><h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">Контакти</h2>
          <div className="flex flex-col gap-1 text-[14px]">
            {p.publicEmail && <a href={`mailto:${p.publicEmail}`} className="font-semibold text-accent">{p.publicEmail}</a>}
            {p.website && <a href={p.website} className="font-semibold text-accent" target="_blank" rel="noreferrer">{p.website}</a>}
            {p.linkedin && <a href={p.linkedin} className="font-semibold text-accent" target="_blank" rel="noreferrer">LinkedIn</a>}
          </div></div>
      )}

      <div className="mt-8"><IntroduceButton targetProfileId={p.id} /></div>
    </div>
  );
}
