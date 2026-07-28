"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ARTICLES, PEOPLE, ORGS, OPPS, EVENTS } from "@/lib/data";
import { ArticleCard, PersonCard, OrgCard, OppCard, EventCard } from "@/components/cards";

function Results() {
  const q = (useSearchParams().get("q") || "").trim().toLowerCase();
  const has = (parts: (string | string[])[]) => parts.flat().join(" ").toLowerCase().includes(q);

  const articles = q ? ARTICLES.filter((a) => has([a.title, a.subtitle, a.category, a.type])) : [];
  const people = q ? PEOPLE.filter((p) => has([p.name, p.role, p.competencies])) : [];
  const orgs = q ? ORGS.filter((o) => has([o.name, o.type, o.city, o.sports])) : [];
  const opps = q ? OPPS.filter((o) => has([o.title, o.org, o.type, o.sport])) : [];
  const events = q ? EVENTS.filter((e) => has([e.title, e.org, e.city, e.format])) : [];
  const total = articles.length + people.length + orgs.length + opps.length + events.length;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">
        {q ? <>Результати за «{q}»</> : "Пошук"}
      </h1>
      <p className="mt-2 text-[14px] font-medium text-dim">
        {q ? `Знайдено: ${total}` : "Введіть запит у полі пошуку вгорі."}
      </p>

      {q && total === 0 && (
        <p className="mt-16 text-center text-[15px] font-semibold text-muted">Нічого не знайдено за «{q}». Спробуйте інший запит.</p>
      )}

      {articles.length > 0 && (
        <Section title={`Матеріали · ${articles.length}`}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        </Section>
      )}
      {opps.length > 0 && (
        <Section title={`Можливості · ${opps.length}`}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{opps.map((o) => <OppCard key={o.id} o={o} />)}</div>
        </Section>
      )}
      {people.length > 0 && (
        <Section title={`Люди · ${people.length}`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{people.map((p) => <PersonCard key={p.id} p={p} />)}</div>
        </Section>
      )}
      {orgs.length > 0 && (
        <Section title={`Організації · ${orgs.length}`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{orgs.map((o) => <OrgCard key={o.id} o={o} />)}</div>
        </Section>
      )}
      {events.length > 0 && (
        <Section title={`Події · ${events.length}`}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">{events.map((e) => <EventCard key={e.id} e={e} />)}</div>
        </Section>
      )}

      <div className="mt-16">
        <Link href="/" className="text-[13px] font-bold text-accent">← На головну</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-6 text-[13px] font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm font-semibold text-muted">Завантаження…</div>}>
      <Results />
    </Suspense>
  );
}
