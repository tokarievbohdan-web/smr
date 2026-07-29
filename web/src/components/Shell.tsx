"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/data";
import AuthWidget from "@/components/auth/AuthWidget";

const ICONS: Record<string, React.ReactNode> = {
  "/": <path d="M4 5h16M4 12h16M4 19h10" />,
  "/network": <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.2" /><path d="M15.5 20a5 5 0 0 1 5.5-4.7" /></>,
  "/opportunities": <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /></>,
  "/events": <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  "/profile": <><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 h-screen w-[248px] flex-col bg-panel p-4 transition-transform md:sticky md:top-0 md:flex md:translate-x-0 ${open ? "flex translate-x-0" : "hidden -translate-x-full md:flex"}`}
      >
        <Link href="/" className="flex items-center gap-2.5 px-2 pb-5 pt-1.5" onClick={() => setOpen(false)}>
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-accent text-[13px] font-extrabold tracking-tighter text-white">SM</span>
          <span className="leading-tight">
            <b className="block text-[15px] tracking-tight">Sport Market Review</b>
            <span className="text-[10.5px] font-semibold text-muted">Спортивний бізнес України</span>
          </span>
        </Link>
        <nav className="mt-1.5 flex flex-col gap-0.5">
          {NAV.map((n) => {
            const on = isActive(n.href);
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${on ? "bg-white text-[#16181D] shadow-sm" : "text-dim hover:bg-panel2 hover:text-ink"}`}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                  {ICONS[n.href]}
                </svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <AuthWidget />
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 bg-ground/85 px-4 py-4 backdrop-blur md:px-10">
          <button className="grid h-11 w-11 place-items-center rounded-xl bg-panel md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <form onSubmit={submitSearch} className="flex h-11 max-w-[540px] flex-1 items-center gap-2.5 rounded-xl bg-panel px-4 text-[13.5px] focus-within:ring-2 focus-within:ring-accent/40">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-muted"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: матеріали, люди, організації…"
              className="min-w-0 flex-1 bg-transparent font-medium text-ink outline-none placeholder:text-muted" aria-label="Пошук" />
            <kbd className="hidden shrink-0 rounded-md bg-panel2 px-1.5 py-0.5 text-[11px] font-semibold text-muted sm:block">↵</kbd>
          </form>
          <div className="ml-auto flex items-center gap-2.5">
            <button className="relative grid h-11 w-11 place-items-center rounded-xl bg-panel" aria-label="Сповіщення">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
              <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-[9px] border-2 border-ground bg-accent px-1 text-[10px] font-extrabold text-white">5</span>
            </button>
            <ThemeToggle />
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-panel2 text-[13px] font-extrabold text-dim">ОК</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setDark(cur === "dark");
  }, []);
  const toggle = () => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("smr-theme", next); } catch {}
    setDark(next === "dark");
  };
  return (
    <button onClick={toggle} className="h-11 rounded-xl bg-panel px-4 text-[12.5px] font-bold text-dim" aria-label="Перемкнути тему">
      {dark === null ? "Тема" : dark ? "Світла" : "Темна"}
    </button>
  );
}
