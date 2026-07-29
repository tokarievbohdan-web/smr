import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { requireUser } from '@/server/auth/guards';
import { userClient } from '@/server/database/clients';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Збережені матеріали користувача (лише свої — RLS). Для article повертаємо
// summary опублікованого матеріалу (archived/видалені відпадають через join).
export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const user = await requireUser(req);
    const db = userClient(user.jwt);
    const { data: bm, error } = await db.from('bookmarks')
      .select('entity_type,entity_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw new ApiHttpError('server_error', error.message);
    const articleIds = (bm ?? []).filter((b) => b.entity_type === 'article').map((b) => b.entity_id);
    let articles: Record<string, unknown>[] = [];
    if (articleIds.length) {
      const { data } = await db.from('public_articles')
        .select('id,slug,title,excerpt,cover,type,published_at,author_name,category_title').in('id', articleIds);
      articles = data ?? [];
    }
    const byId = new Map(articles.map((a) => [a.id as string, a]));
    const items = (bm ?? []).map((b) => ({
      entityType: b.entity_type, entityId: b.entity_id, createdAt: b.created_at,
      article: b.entity_type === 'article' ? byId.get(b.entity_id) ?? null : null,
      available: b.entity_type === 'article' ? byId.has(b.entity_id) : true, // archived/видалене → недоступне
    }));
    return jsonOk({ items }, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
