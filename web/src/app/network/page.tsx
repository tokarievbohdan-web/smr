"use client";
import { useState } from "react";
import { PEOPLE, ORGS, type Person, type Org } from "@/lib/data";
import { PersonCard, OrgCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Медіа", "Комерція", "Київ", "Лише верифіковані"];

function match(chip: string, item: Person | Org, isPeople: boolean): boolean {
  if (chip === "Усі") return true;
  if (chip === "Лише верифіковані") return !!item.verified;
  if (chip === "Київ") return isPeople ? (item as Person).role.includes("Київ") : (item as Org).city === "Київ";
  const hay = isPeople
    ? [(item as Person).name, (item as Person).role, ...(item as Person).competencies]
    : [(item as Org).name, (item as Org).type, (item as Org).city, ...(item as Org).sports];
  return hay.join(" ").toLowerCase().includes(chip.toLowerCase());
}

export default function NetworkPage() {
  const [tab, setTab] = useState<"people" | "orgs">("people");
  const [chip, setChip] = useState("Усі");
  const isPeople = tab === "people";

  const people = PEOPLE.filter((p) => match(chip, p, true));
  const orgs = ORGS.filter((o) => match(chip, o, false));
  const shown = isPeople ? people.length : orgs.length;

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
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setChip(c)}
              className={`rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition ${chip === c ? "bg-ink text-ground" : "bg-panel text-dim hover:text-ink"}`}>{c}</button>
          ))}
        </div>
      </div>

      {shown === 0 ? (
        <p className="mt-16 text-center text-[15px] font-semibold text-muted">Нічого не знайдено за фільтром «{chip}».</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {isPeople ? people.map((p) => <PersonCard key={p.id} p={p} />) : orgs.map((o) => <OrgCard key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}
