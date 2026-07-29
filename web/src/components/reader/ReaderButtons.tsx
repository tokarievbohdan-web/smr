"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

// Відправка analytics (best-effort, не блокує). Не пишемо тіло/секрети.
function track(event: string, entityId: string, token: string | null) {
  apiFetch("/api/analytics", { method: "POST", token, body: { eventName: event, entityType: "article", entityId, platform: "web" } }).catch(() => {});
}

/** Один view на статтю за сесію. */
export function ViewTracker({ entityId }: { entityId: string }) {
  const { ready, token } = useAuth();
  useEffect(() => {
    if (!ready || !entityId) return;
    const key = `smr_viewed_${entityId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
    track("article_viewed", entityId, token);
  }, [ready, entityId, token]);
  return null;
}

export function BookmarkButton({ entityId }: { entityId: string }) {
  const { ready, configured, user, token } = useAuth();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [need, setNeed] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!ready || !token || checked.current) return;
    checked.current = true;
    apiFetch<{ items: { entityId: string }[] }>("/api/me/bookmarks", { token })
      .then((d) => setSaved(d.items.some((b) => b.entityId === entityId)))
      .catch(() => setSaved(false));
  }, [ready, token, entityId]);

  if (!configured) return null;

  async function toggle() {
    if (!user || !token) { setNeed(true); setTimeout(() => setNeed(false), 2600); return; }
    const next = !saved;
    setSaved(next); setBusy(true); // optimistic
    try {
      if (next) { await apiFetch("/api/bookmarks", { method: "POST", token, body: { entityType: "article", entityId } }); track("article_saved", entityId, token); }
      else { await apiFetch(`/api/bookmarks/article/${entityId}`, { method: "DELETE", token }); track("article_unsaved", entityId, token); }
    } catch { setSaved(!next); /* rollback при помилці */ }
    finally { setBusy(false); }
  }

  const active = saved === true;
  return (
    <span className="relative inline-flex">
      <button onClick={toggle} disabled={busy} aria-pressed={active}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold transition ${active ? "bg-accent text-white" : "bg-panel text-dim hover:bg-panel2"}`}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M6 4h12v16l-6-4-6 4z" /></svg>
        {active ? "Збережено" : "Зберегти"}
      </button>
      {need && <span className="absolute left-0 top-full mt-2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-panel">Увійдіть, щоб зберігати →</span>}
    </span>
  );
}

export function ShareButton({ entityId, title }: { entityId: string; title: string }) {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    } catch { /* скасовано користувачем */ }
    track("article_shared", entityId, token);
  }
  return (
    <button onClick={share} className="inline-flex items-center gap-2 rounded-full bg-panel px-4 py-2 text-[13.5px] font-bold text-dim transition hover:bg-panel2">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8 11l8-4.5M8 13l8 4.5" /></svg>
      {copied ? "Скопійовано" : "Поділитися"}
    </button>
  );
}
