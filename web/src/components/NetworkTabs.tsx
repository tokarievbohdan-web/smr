import Link from "next/link";

// Перемикач Люди / Організації (server-friendly, active за пропом).
export function NetworkTabs({ active }: { active: "people" | "orgs" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link href={href} className={`rounded-full px-4 py-2 text-[14px] font-bold transition ${on ? "bg-white text-[#16181D] shadow-sm" : "bg-panel text-dim hover:bg-panel2"}`}>{label}</Link>
  );
  return (
    <div className="mb-8 flex gap-2">
      {tab("/network/people", "Люди", active === "people")}
      {tab("/network/organizations", "Організації", active === "orgs")}
    </div>
  );
}
