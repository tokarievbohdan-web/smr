"use client";
import { useState } from "react";
import { EVENTS, type EventItem } from "@/lib/data";
import { EventCard } from "@/components/cards";

const CHIPS = ["Усі", "Цього тижня", "Онлайн", "Офлайн", "Київ"];

function match(chip: string, e: EventItem): boolean {
  if (chip === "Усі") return true;
  if (chip === "Цього тижня") return !!e.thisWeek;
  if (chip === "Онлайн") return e.format === "Онлайн";
  if (chip === "Офлайн") return e.format === "Офлайн";
  if (chip === "Київ") return e.city === "Київ";
  return true;
}

export default function EventsPage() {
  const [chip, setChip] = useState("Усі");
  const list = EVENTS.filter((e) => match(chip, e));

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Події</h1>
          <p className="mt-3 text-[15px] font-medium text-dim">Форуми, воркшопи та нетворкінг спортивного бізнесу</p>
        </div>
        <button className="rounded-xl bg-accent px-5 py-3 text-[13px] font-bold text-white transition hover:opacity-90">+ Створити подію</button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button key={c} onClick={() => setChip(c)}
            className={`rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition ${chip === c ? "bg-ink text-ground" : "bg-panel text-dim hover:text-ink"}`}>{c}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-[15px] font-semibold text-muted">За фільтром «{chip}» подій не знайдено.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}
