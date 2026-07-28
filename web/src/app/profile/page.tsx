import { Verified } from "@/components/ui";

const MENU = [
  ["◲", "Збережене"], ["▤", "Мої можливості"], ["➤", "Мої відгуки"],
  ["▦", "Мої події"], ["⇄", "Запити на знайомство"], ["▣", "Мої організації"], ["⚙", "Налаштування"],
];
const RECS = ["Додайте portfolio-посилання", "Вкажіть компетенції", "Оберіть додаткові статуси доступності"];
const KPI = [["14", "Збережено"], ["3", "Мої можливості"], ["2", "Реєстрації"]];

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="text-[34px] font-extrabold leading-none tracking-tight">Профіль</h1>
      <p className="mt-3 text-[15px] font-medium text-dim">Особистий кабінет</p>

      <div className="mt-8 grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-6 rounded-3xl bg-panel p-7">
            <span className="relative grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-panel2 text-[32px] font-extrabold text-dim">
              ОК<i className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-[3px] border-panel bg-accent" />
            </span>
            <div className="min-w-[200px] flex-1">
              <h2 className="flex items-center gap-2 text-[24px] font-extrabold tracking-tight">Олена Ковальчук <Verified size={18} /></h2>
              <div className="mt-1.5 text-[14px] font-semibold text-dim">Head of Sponsorship · ФК «Динамо» Київ</div>
              <div className="mt-1 text-[13px] font-semibold text-muted">Київ, Україна</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Шукаю партнерів", "Готова бути спікером"].map((a) => (
                  <span key={a} className="rounded-full bg-accentsoft px-3 py-1.5 text-[12px] font-bold text-accentink">{a}</span>
                ))}
              </div>
            </div>
            <button className="shrink-0 rounded-xl bg-panel2 px-5 py-3 text-[13px] font-bold transition hover:brightness-95">Редагувати</button>
          </div>

          <div className="rounded-3xl bg-panel p-7">
            <div className="flex items-center justify-between">
              <b className="text-[15px]">Профіль заповнено на 67%</b>
              <span className="tabnums text-[13px] font-bold text-muted">6/9</span>
            </div>
            <div className="my-4 h-2.5 overflow-hidden rounded-full bg-panel2"><i className="block h-full w-[67%] rounded-full bg-accent" /></div>
            <div className="flex flex-col gap-1.5">
              {RECS.map((r) => <div key={r} className="flex items-center gap-2 py-1 text-[13.5px] font-semibold text-accent">＋ {r}</div>)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {KPI.map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-panel p-5">
                <div className="tabnums text-[28px] font-extrabold tracking-tight">{v}</div>
                <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-1 rounded-3xl bg-panel p-3">
          {MENU.map(([ic, label]) => (
            <a key={label} className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-[14.5px] font-semibold transition hover:bg-panel2">
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
