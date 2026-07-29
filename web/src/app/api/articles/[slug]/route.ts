import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getArticleBySlug } from '@/server/articles/queries';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, routeCtx: { params: Promise<{ slug: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const { slug } = await routeCtx.params;
    const a = await getArticleBySlug(getBearerToken(req), slug);
    if (!a) throw new ApiHttpError('not_found', 'Article not found');
    return jsonOk(a, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
