import { Verified } from "@/components/ui";

const MENU = [
  ["◲", "Збережене"], ["▤", "Мої можливості"], ["➤", "Мої відгуки"],
  ["▦", "Мої події"], ["⇄", "Запити на знайомство"], ["▣", "Мої організації"], ["⚙", "Налаштування"],
];
const RECS = ["Додайте portfolio-посилання", "Вкажіть компетенції", "Оберіть додаткові статуси доступності"];
const KPI = [["14", "Збережено"], ["3", "Мої можливості"], ["2", "Реєстрації"]];

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8">
      <h1 className="text-[26px] font-extrabold tracking-tight">Профіль</h1>
      <p className="mt-1 text-[13.5px] font-medium text-dim">Особистий кабінет</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-card p-6 shadow-card">
            <span className="relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-[22px] bg-panel2 text-[30px] font-extrabold text-dim">
              ОК<i className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-[3px] border-card bg-accent" />
            </span>
            <div className="min-w-[200px] flex-1">
              <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">Олена Ковальчук <Verified size={18} /></h2>
              <div className="mt-1 text-[13.5px] font-semibold text-dim">Head of Sponsorship · ФК «Динамо» Київ</div>
              <div className="mt-0.5 text-[12.5px] font-semibold text-muted">Київ, Україна</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Шукаю партнерів", "Готова бути спікером"].map((a) => (
                  <span key={a} className="rounded-full bg-accentsoft px-2.5 py-1 text-[11px] font-bold text-accentink">{a}</span>
                ))}
              </div>
            </div>
            <button className="shrink-0 rounded-[10px] border border-line2 bg-card px-3.5 py-2.5 text-[12.5px] font-bold">Редагувати</button>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <b className="text-sm">Профіль заповнено на 67%</b>
              <span className="tabnums text-[12.5px] font-bold text-muted">6/9</span>
            </div>
            <div className="my-3 h-2.5 overflow-hidden rounded-full bg-panel2"><i className="block h-full w-[67%] rounded-full bg-accent" /></div>
            <div className="flex flex-col gap-1">
              {RECS.map((r) => <div key={r} className="flex items-center gap-2 py-1 text-[13px] font-semibold text-accent">＋ {r}</div>)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {KPI.map(([v, l]) => (
              <div key={l} className="rounded-xl border border-line bg-card p-3.5">
                <div className="tabnums text-2xl font-extrabold tracking-tight">{v}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {MENU.map(([ic, label], i) => (
            <a key={label} className="flex items-center gap-3 border-t border-line px-4.5 py-4 text-sm font-semibold first:border-none hover:bg-panel" style={i === 0 ? { borderTop: "none" } : undefined}>
              <span className="text-muted">{ic}</span>{label}
              {label === "Запити на знайомство"
                ? <span className="ml-auto rounded-lg bg-warnbg px-2 py-0.5 text-[11px] font-extrabold text-warn">1</span>
                : <span className="ml-auto text-muted">→</span>}
            </a>
          ))}
        </aside>
      </div>
    </div>
  );
}
