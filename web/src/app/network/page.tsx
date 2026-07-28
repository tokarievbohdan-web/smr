"use client";
import { useState } from "react";
import { PEOPLE, ORGS } from "@/lib/data";
import { PersonCard, OrgCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Медіа", "Комерція", "Київ", "Лише верифіковані"];

export default function NetworkPage() {
  const [tab, setTab] = useState<"people" | "orgs">("people");
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Мережа</h1>
      <p className="mt-3 text-[15px] font-medium text-dim">Структурований довідник учасників індустрії</p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="inline-flex gap-1 rounded-xl bg-panel2 p-1">
          {(["people", "orgs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-[9px] px-5 py-2.5 text-[13.5px] font-bold transition ${tab === t ? "bg-ground text-ink" : "text-dim"}`}>
              {t === "people" ? "Люди" : "Організації"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c, i) => (
            <span key={c} className={`rounded-full px-4 py-2.5 text-[12.5px] font-semibold ${i === 0 ? "bg-ink text-ground" : "bg-panel text-dim"}`}>{c}</span>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {tab === "people" ? PEOPLE.map((p) => <PersonCard key={p.id} p={p} />) : ORGS.map((o) => <OrgCard key={o.id} o={o} />)}
      </div>
    </div>
  );
}
