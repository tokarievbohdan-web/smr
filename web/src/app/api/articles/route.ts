import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getArticleFeed } from '@/server/articles/queries';
import { jsonOk, jsonError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Публічна стрічка Articles (summary + фільтри + пагінація + пошук).
export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const sp = req.nextUrl.searchParams;
    const data = await getArticleFeed(getBearerToken(req), {
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
      category: sp.get('category'), type: sp.get('type'), tag: sp.get('tag'),
      search: sp.get('q'), featured: sp.get('featured') === '1',
    });
    return jsonOk(data, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
