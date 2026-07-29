import 'server-only';
import { DATA_MODE } from '@/server/env';
import { getArticleFeed, getArticleBySlug, type FeedParams } from '@/server/articles/queries';
import { anonClient } from '@/server/database/clients';
import { ARTICLES, type Article } from '@/lib/data';
import { articleTypeLabel } from '@shared/contracts/status';

// Уніфікований data-layer сторінок Review. У production (DATA_MODE=supabase)
// читає з Supabase; у розробці (mock) — з локальних fixtures. Production НЕ
// має тихого fallback на mock (env.ts падає, якщо supabase без ключів).

export interface ReviewCard {
  slug: string; typeLabel: string; categoryLabel: string | null;
  title: string; subtitle: string | null; author: string | null;
  readMin: number | null; featured: boolean; cover: string | null;
}
export interface ReviewDetail extends ReviewCard {
  id: string;
  body: unknown; bodyParagraphs: string[] | null; publishedAt: string | null;
  authorHeadline: string | null; categorySlug: string | null; tags: { name: string; slug: string }[];
  seoTitle: string | null; seoDescription: string | null; canonicalUrl: string | null;
}

const mockCard = (a: Article): ReviewCard => ({
  slug: a.id, typeLabel: a.type, categoryLabel: a.category, title: a.title,
  subtitle: a.subtitle, author: a.author, readMin: a.readMin, featured: !!a.featured, cover: null,
});

export async function listReview(params: FeedParams = {}): Promise<{ items: ReviewCard[]; total: number | null }> {
  if (DATA_MODE === 'supabase') {
    const f = await getArticleFeed(null, params);
    return {
      total: f.total,
      items: f.items.map((a) => ({
        slug: a.slug, typeLabel: articleTypeLabel(a.type), categoryLabel: a.category?.title ?? null,
        title: a.title, subtitle: a.subtitle ?? null, author: a.author?.name ?? null,
        readMin: a.readingTimeMinutes ?? null, featured: a.featured, cover: a.cover ?? null,
      })),
    };
  }
  let items = ARTICLES.map(mockCard);
  if (params.featured) items = items.filter((i) => i.featured);
  return { items, total: items.length };
}

export async function getReview(slug: string): Promise<ReviewDetail | null> {
  if (DATA_MODE === 'supabase') {
    const a = await getArticleBySlug(null, slug);
    if (!a) return null;
    return {
      id: a.id,
      slug: a.slug, typeLabel: articleTypeLabel(a.type), categoryLabel: a.category?.title ?? null,
      categorySlug: a.category?.slug ?? null, title: a.title, subtitle: a.subtitle ?? null,
      author: a.author?.name ?? null, authorHeadline: a.author?.headline ?? null,
      readMin: a.readingTimeMinutes ?? null, featured: a.featured, cover: a.cover ?? null,
      body: a.body, bodyParagraphs: null, publishedAt: a.publishedAt ?? null,
      tags: a.tags ?? [], seoTitle: a.seoTitle ?? null, seoDescription: a.seoDescription ?? null,
      canonicalUrl: a.canonicalUrl ?? null,
    };
  }
  const a = ARTICLES.find((x) => x.id === slug);
  if (!a) return null;
  return {
    id: a.id, ...mockCard(a), categorySlug: null, body: null,
    bodyParagraphs: a.body ?? [a.subtitle], publishedAt: a.date, authorHeadline: null,
    tags: [], seoTitle: null, seoDescription: a.subtitle, canonicalUrl: null,
  };
}

// Slug + дата для sitemap (усі опубліковані).
export async function reviewSitemap(): Promise<{ slug: string; updatedAt: string }[]> {
  if (DATA_MODE === 'supabase') {
    const { data } = await anonClient().from('public_articles').select('slug,updated_at,published_at').limit(2000);
    return (data ?? []).map((r: Record<string, unknown>) => ({ slug: String(r.slug), updatedAt: String(r.updated_at ?? r.published_at ?? '') }));
  }
  return ARTICLES.map((a) => ({ slug: a.id, updatedAt: '2026-07-01T00:00:00.000Z' }));
}

export async function similarReview(categorySlugOrLabel: string | null, excludeSlug: string): Promise<ReviewCard[]> {
  const { items } = await listReview({ category: DATA_MODE === 'supabase' ? categorySlugOrLabel : undefined, limit: 4 });
  return items.filter((i) => i.slug !== excludeSlug).slice(0, 3);
}
