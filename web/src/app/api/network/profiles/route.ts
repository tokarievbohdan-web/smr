import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { getProfileDirectory } from '@/server/network/queries';
import { jsonOk, jsonError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const sp = req.nextUrl.searchParams;
    const data = await getProfileDirectory(getBearerToken(req), {
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
      search: sp.get('q'), verified: sp.get('verified') === '1',
      sport: sp.get('sport'), category: sp.get('category'), skill: sp.get('skill'),
      city: sp.get('city'), region: sp.get('region'), country: sp.get('country'),
      availability: sp.get('availability'),
    });
    return jsonOk(data, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
