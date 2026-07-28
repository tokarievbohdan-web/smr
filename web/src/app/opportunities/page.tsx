import { OPPS } from "@/lib/data";
import { OppCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Партнерство", "Вакансія", "Тендер", "Інвестиція"];

export default function OpportunitiesPage() {
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
        {CHIPS.map((c, i) => (
          <span key={c} className={`rounded-full px-4 py-2.5 text-[12.5px] font-semibold ${i === 0 ? "bg-ink text-ground" : "bg-panel text-dim"}`}>{c}</span>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {OPPS.map((o) => <OppCard key={o.id} o={o} />)}
      </div>
    </div>
  );
}
