"use client";
import { useState } from "react";
import { PEOPLE, ORGS } from "@/lib/data";
import { PersonCard, OrgCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Медіа", "Комерція", "Київ", "Лише верифіковані"];

export default function NetworkPage() {
  const [tab, setTab] = useState<"people" | "orgs">("people");
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8">
      <h1 className="text-[26px] font-extrabold tracking-tight">Мережа</h1>
      <p className="mt-1 text-[13.5px] font-medium text-dim">Структурований довідник учасників індустрії</p>

      <div className="mt-6 flex flex-wrap items-center gap-3.5">
        <div className="inline-flex gap-1 rounded-xl border border-line2 bg-panel p-1">
          {(["people", "orgs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-[9px] px-4 py-2 text-[13px] font-bold ${tab === t ? "bg-card text-ink shadow-card" : "text-dim"}`}>
              {t === "people" ? "Люди" : "Організації"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c, i) => (
            <span key={c} className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold ${i === 0 ? "border-ink bg-ink text-ground" : "border-line2 bg-card text-ink"}`}>{c}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tab === "people" ? PEOPLE.map((p) => <PersonCard key={p.id} p={p} />) : ORGS.map((o) => <OrgCard key={o.id} o={o} />)}
      </div>
    </div>
  );
}
