import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anonClient, userClient } from '../database/clients';

// Клієнт для читання: якщо є Bearer — від імені користувача (authenticated-level
// матеріали), інакше anon (лише public). RLS вирішує видимість.
export function readClient(jwt: string | null): SupabaseClient {
  return jwt ? userClient(jwt) : anonClient();
}

const SUMMARY_SELECT =
  'id,slug,type,title,subtitle,excerpt,cover,reading_time_minutes,featured,partner_material,published_at,access_level,' +
  'author:authors(name,slug,avatar_media_id,headline),' +
  'category:article_categories(title,slug)';

const DETAIL_SELECT =
  SUMMARY_SELECT +
  ',body,content_version,case_study_data,seo_title,seo_description,canonical_url,language,views,' +
  'tags:article_tag_links(article_tags(name,slug))';

type Row = Record<string, any>;

function mapSummary(r: Row) {
  return {
    id: r.id, slug: r.slug, type: r.type, title: r.title, subtitle: r.subtitle ?? null,
    excerpt: r.excerpt ?? null, cover: r.cover ?? null,
    readingTimeMinutes: r.reading_time_minutes ?? null,
    featured: !!r.featured, partnerMaterial: !!r.partner_material,
    accessLevel: r.access_level, publishedAt: r.published_at ?? null,
    author: r.author ? { name: r.author.name, slug: r.author.slug, avatarId: r.author.avatar_media_id ?? null, headline: r.author.headline ?? null } : null,
    category: r.category ? { title: r.category.title, slug: r.category.slug } : null,
  };
}

function mapDetail(r: Row) {
  return {
    ...mapSummary(r),
    body: r.body ?? { version: 1, blocks: [] },
    contentVersion: r.content_version ?? 1,
    caseStudyData: r.case_study_data ?? null,
    seoTitle: r.seo_title ?? null, seoDescription: r.seo_description ?? null,
    canonicalUrl: r.canonical_url ?? null, language: r.language ?? 'uk', views: r.views ?? 0,
    tags: Array.isArray(r.tags) ? r.tags.map((t: Row) => t.article_tags).filter(Boolean).map((t: Row) => ({ name: t.name, slug: t.slug })) : [],
  };
}

export interface FeedParams {
  limit?: number; offset?: number;
  category?: string | null; type?: string | null; tag?: string | null; search?: string | null; featured?: boolean;
}

export async function getArticleFeed(jwt: string | null, p: FeedParams) {
  const db = readClient(jwt);
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 50);
  const offset = Math.max(p.offset ?? 0, 0);

  let q = db.from('articles').select(SUMMARY_SELECT, { count: 'estimated' })
    .eq('status', 'published').is('deleted_at', null).lte('published_at', new Date().toISOString());

  if (p.featured) q = q.eq('featured', true);
  if (p.type) q = q.eq('type', p.type);
  if (p.category) {
    const { data: c } = await db.from('article_categories').select('id').eq('slug', p.category).maybeSingle();
    if (!c) return { items: [], total: 0, limit, offset, nextCursor: null };
    q = q.eq('category_id', c.id);
  }
  if (p.search) q = q.textSearch('tsv', p.search, { type: 'websearch', config: 'simple' });

  q = q.order('published_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  const items = (data ?? []).map(mapSummary);
  return { items, total: count ?? null, limit, offset, nextCursor: items.length === limit ? String(offset + limit) : null };
}

export async function getArticleBySlug(jwt: string | null, slug: string) {
  const db = readClient(jwt);
  // прямий збіг або редірект зі slug_history
  const first = await db.from('articles').select(DETAIL_SELECT)
    .eq('slug', slug).eq('status', 'published').is('deleted_at', null)
    .lte('published_at', new Date().toISOString()).maybeSingle();
  if (first.error) throw first.error;
  let row: Row | null = (first.data as Row) ?? null;
  if (!row) {
    const { data: hist } = await db.from('article_slug_history').select('article_id').eq('old_slug', slug).maybeSingle();
    if (hist) {
      const r = await db.from('articles').select(DETAIL_SELECT).eq('id', hist.article_id)
        .eq('status', 'published').is('deleted_at', null).maybeSingle();
      row = (r.data as Row) ?? null;
    }
  }
  if (!row) return null;
  const detail = mapDetail(row);
  // публічні relations (RLS вже фільтрує на рівні is_article_public)
  const { data: rels } = await db.from('article_relations')
    .select('related_entity_type,related_entity_id,relation_type,sort_order')
    .eq('article_id', row.id).order('sort_order');
  return { ...detail, relations: (rels ?? []).map((x: Row) => ({ entityType: x.related_entity_type, entityId: x.related_entity_id, relationType: x.relation_type })) };
}
