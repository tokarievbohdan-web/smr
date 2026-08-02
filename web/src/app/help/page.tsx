"use client";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

const FAQ: [string, string][] = [
  ["Що таке SMR?", "Sport Market Review — професійна B2B-екосистема спортивного бізнесу України: галузевий контент, мережа людей і організацій, ділові можливості, керовані знайомства та події."],
  ["Для кого створена платформа?", "Клуби, федерації, ліги, бренди, агентства, медіа, інвестори, спеціалісти, стартапи та організатори подій спортивної індустрії."],
  ["Чим SMR відрізняється від LinkedIn?", "SMR сфокусований на українському спортивному ринку, поєднує галузевий контент із перевіреними організаціями, структурованими можливостями та керованими знайомствами за участю команди SMR як довіреного посередника."],
  ["Хто бачить мій профіль?", "Публічні поля профілю бачать авторизовані користувачі. Контактні дані розкриваються лише за вашою згодою (напр. у процесі знайомства). Профіль можна приховати або видалити."],
  ["Як підтвердити організацію?", "Створіть або знайдіть картку організації, отримайте доступ і подайте на верифікацію. Команда SMR перевіряє заявку впродовж 1–2 робочих днів."],
  ["Як опублікувати можливість?", "У розділі «Можливості» → «Створити». Заповніть запит (кого шукаєте, результат, дедлайн) і надішліть на модерацію."],
  ["Хто бачить мою заявку?", "Заявку на можливість бачите ви та автор можливості (організація). Приватні поля не показуються стороннім."],
  ["Як працюють професійні знайомства?", "Ви надсилаєте запит на знайомство. Команда SMR перевіряє контекст і цінність для іншої сторони, отримує її згоду і лише тоді обмінюється контактами. Повного чату немає."],
  ["Коли передаються контакти?", "Лише після згоди іншої сторони та рівно за тими каналами (email/телефон), які вона дозволила."],
  ["Як зареєструватися на подію?", "На сторінці події натисніть «Зареєструватися». За відсутності місць — потрапите у список очікування й отримаєте пропозицію, щойно місце звільниться."],
  ["Як видалити акаунт?", "У налаштуваннях профілю → запит на видалення. Діє період очікування; ділова історія зберігається знеособлено згідно з політикою даних."],
  ["Як повідомити про помилку?", "Скористайтесь формою нижче або напишіть команді SMR."],
];

export default function HelpPage() {
  const { user, token } = useAuth();
  const [type, setType] = useState("bug");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!message.trim()) return;
    setBusy(true); setMsg(null);
    try { await apiFetch("/api/feedback", { method: "POST", token, body: { type, message, platform: "web", screen: "/help" } }); setMsg("Дякуємо! Ваше повідомлення надіслано команді SMR."); setMessage(""); }
    catch { setMsg("Не вдалося надіслати. Спробуйте пізніше."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="text-[32px] font-extrabold tracking-tight">Допомога</h1>
      <p className="mt-3 text-[15px] text-dim">Відповіді на часті запитання та звʼязок із командою SMR.</p>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Часті запитання</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-2xl bg-panel p-4">
              <summary className="cursor-pointer text-[15px] font-bold">{q}</summary>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-muted">Повідомити про проблему</h2>
        {!user ? (
          <div className="rounded-2xl bg-panel p-5 text-[14px] text-muted">Увійдіть, щоб надіслати повідомлення команді SMR.</div>
        ) : (
          <div className="rounded-2xl bg-panel p-5">
            <div className="flex flex-wrap gap-2">
              {[["bug", "Помилка"], ["improvement", "Пропозиція"], ["data_issue", "Некоректні дані"], ["other", "Інше"]].map(([v, l]) => (
                <button key={v} onClick={() => setType(v)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${type === v ? "bg-ink text-ground" : "bg-panel2 text-dim"}`}>{l}</button>
              ))}
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Опишіть проблему або ідею…" className="mt-3 min-h-[110px] w-full rounded-xl bg-panel2 px-3 py-2.5 text-[14px] outline-none" />
            <div className="mt-3 flex items-center gap-3">
              <button disabled={busy} onClick={send} className="rounded-xl bg-accent px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60">Надіслати</button>
              {msg && <span className="text-[13px] font-semibold text-dim">{msg}</span>}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-muted">Звʼязатися з командою SMR</h2>
        <p className="text-[14px] text-dim">Напишіть нам: <a href="mailto:support@sportmarketreview.com" className="font-semibold text-accent">support@sportmarketreview.com</a></p>
      </section>
    </div>
  );
}
