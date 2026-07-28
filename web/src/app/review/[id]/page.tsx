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
    <div className="mx-auto w-full max-w-[760px] px-6 pb-24 pt-10 md:px-8">
      <Link href="/" className="text-[13px] font-bold text-accent">← До стрічки</Link>
      <div className="mt-6"><Badge tone="accent">{a.category} · {a.type}</Badge></div>
      <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-tight">{a.title}</h1>
      <p className="mt-5 text-[19px] leading-relaxed text-dim">{a.subtitle}</p>
      <div className="mt-8 flex items-center gap-3 py-2">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-panel2 text-xs font-extrabold text-dim">{a.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
        <div><div className="text-[14px] font-bold">{a.author}</div><div className="text-[12.5px] font-semibold text-muted">{a.date} · {a.readMin} хв читання</div></div>
      </div>
      <Thumb className="mt-8 aspect-video rounded-3xl" label="кадр матеріалу" />
      <article className="mt-10 flex flex-col gap-6">
        {body.map((p, i) => <p key={i} className="text-[17px] leading-[1.75] text-ink/90">{p}</p>)}
      </article>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-[22px] font-extrabold tracking-tight">Схожі матеріали</h2>
          <div className="flex flex-col gap-3">
            {similar.map((s) => (
              <Link key={s.id} href={`/review/${s.id}`} className="flex items-center gap-4 rounded-2xl bg-panel p-4 transition hover:bg-panel2">
                <Thumb className="h-16 w-16 shrink-0 rounded-xl" label="" />
                <div><div className="text-[14.5px] font-bold leading-snug">{s.title}</div><div className="mt-1 text-[12px] font-semibold text-muted">{s.category} · {s.type}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
