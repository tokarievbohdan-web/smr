import { OPPS } from "@/lib/data";
import { OppCard } from "@/components/cards";

const CHIPS = ["Усі", "Спонсорство", "Партнерство", "Вакансія", "Тендер", "Інвестиція"];

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Можливості</h1>
          <p className="mt-1 text-[13.5px] font-medium text-dim">Вакансії, партнерства, тендери, інвестиції спортивної індустрії</p>
        </div>
        <button className="rounded-[10px] bg-accent px-4.5 py-2.5 text-[13px] font-bold text-white">+ Створити</button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CHIPS.map((c, i) => (
          <span key={c} className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold ${i === 0 ? "border-ink bg-ink text-ground" : "border-line2 bg-card text-ink"}`}>{c}</span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {OPPS.map((o) => <OppCard key={o.id} o={o} />)}
      </div>
    </div>
  );
}
