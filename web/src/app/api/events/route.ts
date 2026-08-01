import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getEventFeed } from '@/server/events/queries';
import { jsonOk, jsonError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const sp = req.nextUrl.searchParams;
    const data = await getEventFeed(getBearerToken(req), {
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
      search: sp.get('q'), type: sp.get('type'), format: sp.get('format'),
      city: sp.get('city'), region: sp.get('region'), country: sp.get('country'), tag: sp.get('tag'),
      online: sp.get('online') === '1', free: sp.get('free') === '1', paid: sp.get('paid') === '1',
      verified: sp.get('verified') === '1', spots: sp.get('spots') === '1',
      timeframe: sp.get('timeframe'), scope: sp.get('scope'), sort: sp.get('sort'),
    });
    return jsonOk(data, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
