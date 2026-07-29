import Link from "next/link";
import type { Metadata } from "next";
import { listReview } from "@/lib/reviewData";
import { Badge } from "@/components/ui";
import { Cover } from "@/components/Cover";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review — Sport Market Review",
  description: "Редакційна стрічка спортивного бізнесу України: новини, кейси, дослідження, інсайти.",
};

export default async function ReviewFeedPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { items } = await listReview({ category: sp.category ?? null, type: sp.type ?? null, search: sp.q ?? null, limit: 30 });
  const featured = items.find((i) => i.featured) ?? items[0];
  const rest = featured ? items.filter((i) => i.slug !== featured.slug) : items;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="mb-10">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Review</h1>
        <p className="mt-3 text-[15px] font-medium text-dim">Редакційна стрічка спортивного бізнесу</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-12 text-center">
          <div className="text-[17px] font-bold">Поки що немає матеріалів</div>
          <div className="mt-2 text-[14px] text-muted">Опубліковані матеріали зʼявляться тут.</div>
        </div>
      ) : (
        <>
          {featured && (
            <Link href={`/review/${featured.slug}`} className="group mb-14 grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-panel p-4 transition hover:bg-panel2 sm:grid-cols-[1.1fr_1fr] sm:p-5">
              <Cover src={featured.cover} label="" className="min-h-[240px] w-full rounded-2xl" />
              <div className="flex flex-col justify-center p-2 sm:p-4">
                <Badge tone="accent">{[featured.categoryLabel, featured.typeLabel].filter(Boolean).join(" · ")}</Badge>
                <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight">{featured.title}</h2>
                {featured.subtitle && <p className="mt-4 text-[15.5px] leading-relaxed text-dim">{featured.subtitle}</p>}
                <div className="mt-6 text-[13px] font-semibold text-muted">{[featured.author, featured.readMin ? `${featured.readMin} хв читання` : null].filter(Boolean).join(" · ")}</div>
              </div>
            </Link>
          )}
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
        </>
      )}
    </div>
  );
}
