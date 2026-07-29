import { validateArticleBody, type ArticleBodyBlock } from "@shared/contracts/articleBody";

// Рендер версіонованого тіла статті. Невідомий блок → безпечний fallback,
// не ламає сторінку (validateArticleBody нормалізує у 'unknown').
export function ArticleBody({ doc }: { doc: unknown }) {
  const r = validateArticleBody(doc);
  const blocks: ArticleBodyBlock[] = r.ok ? r.doc.blocks : [];
  if (!blocks.length) return null;
  return <article className="mt-10 flex flex-col gap-6">{blocks.map(renderBlock)}</article>;
}

function renderBlock(b: ArticleBodyBlock) {
  switch (b.type) {
    case "paragraph":
      return <p key={b.id} className="text-[17px] leading-[1.75] text-ink/90">{b.text}</p>;
    case "heading": {
      const size = b.level === 2 ? "text-[26px]" : b.level === 3 ? "text-[21px]" : "text-[18px]";
      return <h2 key={b.id} className={`${size} mt-4 font-extrabold tracking-tight`}>{b.text}</h2>;
    }
    case "quote":
      return (
        <blockquote key={b.id} className="border-l-4 border-accent pl-5 text-[19px] font-medium italic leading-relaxed text-ink">
          {b.text}{b.author && <footer className="mt-2 text-[13px] font-semibold not-italic text-muted">— {b.author}</footer>}
        </blockquote>
      );
    case "list":
      return b.ordered ? (
        <ol key={b.id} className="list-decimal pl-6 text-[17px] leading-[1.7] text-ink/90">{b.items.map((it, i) => <li key={i} className="mb-1.5">{it}</li>)}</ol>
      ) : (
        <ul key={b.id} className="list-disc pl-6 text-[17px] leading-[1.7] text-ink/90">{b.items.map((it, i) => <li key={i} className="mb-1.5">{it}</li>)}</ul>
      );
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <figure key={b.id} className="my-2"><img src={b.url} alt={b.alt ?? ""} className="w-full rounded-2xl" />{b.caption && <figcaption className="mt-2 text-[13px] text-muted">{b.caption}</figcaption>}</figure>;
    case "callout":
      return <div key={b.id} className="rounded-2xl bg-panel p-5 text-[16px] leading-relaxed text-ink">{b.text}</div>;
    case "table":
      return (
        <div key={b.id} className="overflow-x-auto"><table className="w-full text-[14px]">
          {b.header && <thead><tr>{b.header.map((h, i) => <th key={i} className="border-b border-line p-2 text-left font-bold">{h}</th>)}</tr></thead>}
          <tbody>{b.rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} className="border-b border-line/60 p-2">{c}</td>)}</tr>)}</tbody>
        </table></div>
      );
    case "embed":
      return <a key={b.id} href={b.url} target="_blank" rel="noreferrer" className="text-accent font-semibold underline">{b.provider} ↗</a>;
    default:
      return <div key={(b as { id: string }).id} className="rounded-xl bg-panel2 p-3 text-[13px] text-muted">[непідтримуваний блок]</div>;
  }
}
