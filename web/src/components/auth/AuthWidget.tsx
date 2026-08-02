"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Компактний блок входу в сайдбарі: Email OTP (magic link) або профіль+вихід.
export default function AuthWidget() {
  const { ready, configured, user, signInWithEmail, signOut } = useAuth();
  const [openForm, setOpenForm] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="h-[38px] animate-pulse rounded-xl bg-panel2" />;
  if (!configured) return <div className="text-[11.5px] font-semibold text-muted">Гостьовий режим</div>;

  if (user) {
    const initials = (user.email ?? "?").slice(0, 2).toUpperCase();
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-panel2 text-[13px] font-extrabold text-dim">{initials}</span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-bold">{user.email}</span>
          <span className="flex flex-wrap gap-2 text-[11.5px] font-semibold text-muted">
            <Link href="/profile/edit" className="hover:text-accent">Профіль</Link>
            <Link href="/profile/introductions" className="hover:text-accent">Знайомства</Link>
            <Link href="/profile/events" className="hover:text-accent">Мої події</Link>
            <Link href="/saved" className="hover:text-accent">Збережене</Link>
            <Link href="/help" className="hover:text-accent">Допомога</Link>
            <button onClick={() => signOut()} className="hover:text-accent">Вийти</button>
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!openForm ? (
        <button onClick={() => setOpenForm(true)} className="w-full rounded-xl bg-accent px-3 py-2.5 text-[13.5px] font-bold text-white transition hover:opacity-90">Увійти</button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true); setMsg(null);
            try { await signInWithEmail(email); setMsg("Лист із посиланням надіслано. Відкрийте його — і повернетесь сюди."); }
            catch (err) { setMsg("Помилка: " + ((err as { message?: string })?.message ?? "спробуйте пізніше")); }
            finally { setBusy(false); }
          }}
          className="flex flex-col gap-2"
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ваш email"
            className="rounded-xl bg-panel2 px-3 py-2 text-[13px] outline-none" />
          <button disabled={busy} className="rounded-xl bg-accent px-3 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {busy ? "Надсилаю…" : "Надіслати посилання"}
          </button>
          {msg && <span className="text-[11.5px] font-semibold text-muted">{msg}</span>}
        </form>
      )}
    </div>
  );
}
