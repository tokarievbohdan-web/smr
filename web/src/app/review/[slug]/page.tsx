import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReview, similarReview } from "@/lib/reviewData";
import { ArticleBody } from "@/components/ArticleBody";
import { Badge, Thumb } from "@/components/ui";
import { BookmarkButton, ShareButton, ViewTracker } from "@/components/reader/ReaderButtons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getReview(slug);
  if (!a) return { title: "Матеріал не знайдено — SMR" };
  return {
    title: `${a.seoTitle ?? a.title} — Sport Market Review`,
    description: a.seoDescription ?? a.subtitle ?? undefined,
    alternates: a.canonicalUrl ? { canonical: a.canonicalUrl } : undefined,
    openGraph: { title: a.seoTitle ?? a.title, description: a.seoDescription ?? a.subtitle ?? undefined, type: "article", publishedTime: a.publishedAt ?? undefined },
    twitter: { card: "summary_large_image", title: a.seoTitle ?? a.title, description: a.seoDescription ?? a.subtitle ?? undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getReview(slug);
  if (!a) return notFound();
  const similar = await similarReview(a.categorySlug ?? a.categoryLabel, a.slug);

  const ld = {
    "@context": "https://schema.org", "@type": "NewsArticle", headline: a.title,
    description: a.seoDescription ?? a.subtitle ?? undefined,
    datePublished: a.publishedAt ?? undefined, author: a.author ? { "@type": "Person", name: a.author } : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/review" className="text-[13px] font-bold text-accent">← До стрічки</Link>
      <div className="mt-6"><Badge tone="accent">{[a.categoryLabel, a.typeLabel].filter(Boolean).join(" · ")}</Badge></div>
      <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-tight">{a.title}</h1>
      {a.subtitle && <p className="mt-5 text-[19px] leading-relaxed text-dim">{a.subtitle}</p>}
      {a.author && (
        <div className="mt-8 flex items-center gap-3 py-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-panel2 text-xs font-extrabold text-dim">{a.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
          <div>
            <div className="text-[14px] font-bold">{a.author}</div>
            <div className="text-[12.5px] font-semibold text-muted">{[a.authorHeadline, a.readMin ? `${a.readMin} хв читання` : null].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <BookmarkButton entityId={a.id} />
        <ShareButton entityId={a.id} title={a.title} />
      </div>
      <ViewTracker entityId={a.id} />

      <Thumb className="mt-8 aspect-video rounded-3xl" label="кадр матеріалу" />

      {a.body ? (
        <ArticleBody doc={a.body} />
      ) : (
        <article className="mt-10 flex flex-col gap-6">
          {(a.bodyParagraphs ?? []).map((p, i) => <p key={i} className="text-[17px] leading-[1.75] text-ink/90">{p}</p>)}
        </article>
      )}

      {a.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {a.tags.map((t) => <span key={t.slug} className="rounded-full bg-panel px-3 py-1 text-[12px] font-semibold text-dim">#{t.name}</span>)}
        </div>
      )}

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-[22px] font-extrabold tracking-tight">Схожі матеріали</h2>
          <div className="flex flex-col gap-3">
            {similar.map((s) => (
              <Link key={s.slug} href={`/review/${s.slug}`} className="flex items-center gap-4 rounded-2xl bg-panel p-4 transition hover:bg-panel2">
                <Thumb className="h-16 w-16 shrink-0 rounded-xl" label="" />
                <div><div className="text-[14.5px] font-bold leading-snug">{s.title}</div><div className="mt-1 text-[12px] font-semibold text-muted">{[s.categoryLabel, s.typeLabel].filter(Boolean).join(" · ")}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
