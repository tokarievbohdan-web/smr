import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getOrgBySlug } from '@/server/network/queries';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, routeCtx: { params: Promise<{ slug: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const { slug } = await routeCtx.params;
    const o = await getOrgBySlug(getBearerToken(req), slug);
    if (!o) throw new ApiHttpError('not_found', 'Organization not found');
    return jsonOk(o, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
