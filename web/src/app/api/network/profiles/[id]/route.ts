import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getProfileById } from '@/server/network/queries';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const { id } = await routeCtx.params;
    const p = await getProfileById(getBearerToken(req), id);
    if (!p) throw new ApiHttpError('not_found', 'Profile not found');
    return jsonOk(p, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
