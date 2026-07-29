"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/apiClient";

interface SavedItem {
  entityType: string; entityId: string; createdAt: string; available: boolean;
  article: { slug: string; title: string; excerpt: string | null; author_name?: string | null; category_title?: string | null } | null;
}

export default function SavedPage() {
  const { ready, configured, user, token } = useAuth();
  const [items, setItems] = useState<SavedItem[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) { setItems([]); return; }
    apiFetch<{ items: SavedItem[] }>("/api/me/bookmarks", { token }).then((d) => setItems(d.items)).catch(() => setItems([]));
  }, [ready, token]);

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-10 md:px-8">
      <h1 className="mb-8 text-[30px] font-extrabold tracking-tight">Збережене</h1>

      {!ready ? (
        <div className="h-24 animate-pulse rounded-2xl bg-panel" />
      ) : !configured || !user ? (
        <div className="rounded-3xl bg-panel p-10 text-center">
          <div className="text-[16px] font-bold">Увійдіть, щоб бачити збережені матеріали</div>
          <div className="mt-2 text-[14px] text-muted">Закладки синхронізуються між пристроями.</div>
        </div>
      ) : items && items.length === 0 ? (
        <div className="rounded-3xl bg-panel p-10 text-center">
          <div className="text-[16px] font-bold">Поки що порожньо</div>
          <div className="mt-2 text-[14px] text-muted">Збережені матеріали зʼявляться тут.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(items ?? []).map((it) =>
            it.article ? (
              <Link key={it.entityId} href={`/review/${it.article.slug}`} className="rounded-2xl bg-panel p-5 transition hover:bg-panel2">
                <div className="text-[12px] font-semibold text-muted">{[it.article.category_title, it.article.author_name].filter(Boolean).join(" · ")}</div>
                <div className="mt-1 text-[16px] font-extrabold leading-snug">{it.article.title}</div>
                {it.article.excerpt && <div className="mt-1.5 line-clamp-2 text-[14px] text-dim">{it.article.excerpt}</div>}
              </Link>
            ) : (
              <div key={it.entityId} className="rounded-2xl bg-panel p-5 opacity-70">
                <div className="text-[14px] font-semibold text-muted">Матеріал недоступний (архівовано або видалено)</div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
