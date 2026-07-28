import type { Tone } from "@/lib/data";

const TONE: Record<Tone, string> = {
  accent: "bg-accentsoft text-accentink",
  ok: "bg-okbg text-ok",
  warn: "bg-warnbg text-warn",
  danger: "bg-dangerbg text-danger",
  neutral: "bg-panel2 text-dim",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-panel2 px-2.5 py-1 text-[11px] font-bold text-dim">{children}</span>;
}

export function Verified({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 fill-accent" aria-label="верифіковано">
      <path d="M12 2l2.4 1.6 2.9-.2 1 2.7 2.4 1.6-.7 2.8.7 2.8-2.4 1.6-1 2.7-2.9-.2L12 22l-2.4-1.6-2.9.2-1-2.7L3.3 14.7 4 12l-.7-2.8 2.4-1.6 1-2.7 2.9.2z" />
    </svg>
  );
}

export function Avatar({ initials, size = 52, org }: { initials: string; size?: number; org?: boolean }) {
  return (
    <div
      className={`grid shrink-0 place-items-center bg-panel2 font-extrabold text-dim ${org ? "rounded-xl" : "rounded-2xl"}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

export function Thumb({ label = "фото матеріалу", className = "", children }: { label?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`grid place-items-center bg-gradient-to-br from-panel2 to-panel text-[11px] font-semibold text-muted ${className}`}>
      {label}
      {children}
    </div>
  );
}
