import Link from "next/link";
import { notFound } from "next/navigation";
import { findArticle, ARTICLES } from "@/lib/data";
import { Badge, Thumb } from "@/components/ui";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ id: a.id }));
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = findArticle(id);
  if (!a) return notFound();
  const similar = ARTICLES.filter((x) => x.category === a.category && x.id !== a.id).slice(0, 3);
  const body = a.body ?? [a.subtitle];

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-20 pt-6 md:px-8">
      <Link href="/" className="text-[13px] font-bold text-accent">← До стрічки</Link>
      <div className="mt-4"><Badge tone="accent">{a.category} · {a.type}</Badge></div>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight text-balance">{a.title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-dim">{a.subtitle}</p>
      <div className="mt-5 flex items-center gap-3 border-y border-line py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel2 text-xs font-extrabold text-dim">{a.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
        <div><div className="text-[13.5px] font-bold">{a.author}</div><div className="text-[12px] font-semibold text-muted">{a.date} · {a.readMin} хв читання</div></div>
      </div>
      <Thumb className="mt-6 aspect-video rounded-2xl" label="кадр матеріалу" />
      <article className="mt-6 flex flex-col gap-4">
        {body.map((p, i) => <p key={i} className="text-[15.5px] leading-[1.7] text-ink/90">{p}</p>)}
      </article>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3.5 text-[19px] font-extrabold tracking-tight">Схожі матеріали</h2>
          <div className="flex flex-col gap-2.5">
            {similar.map((s) => (
              <Link key={s.id} href={`/review/${s.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 transition hover:border-line2">
                <Thumb className="h-14 w-14 shrink-0 rounded-lg" label="" />
                <div><div className="text-[13.5px] font-bold leading-snug">{s.title}</div><div className="mt-0.5 text-[11.5px] font-semibold text-muted">{s.category} · {s.type}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
