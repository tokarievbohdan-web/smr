"use client";
import { useState } from "react";
import { OPPS } from "@/lib/data";
import { OppCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Партнерство", "Вакансія", "Тендер", "Інвестиція"];

export default function OpportunitiesPage() {
  const [chip, setChip] = useState("Усі");
  const list = OPPS.filter((o) => chip === "Усі" || o.type === chip);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Можливості</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Вакансії, партнерства, тендери, інвестиції спортивної індустрії</p>
        </div>
        <button className="rounded-xl bg-accent px-5 py-3 text-[13px] font-bold text-white transition hover:opacity-90">+ Створити</button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button key={c} onClick={() => setChip(c)}
            className={`rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition ${chip === c ? "bg-ink text-ground" : "bg-panel text-dim hover:text-ink"}`}>{c}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-[15px] font-semibold text-muted">У категорії «{chip}» поки немає можливостей.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {list.map((o) => <OppCard key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}
