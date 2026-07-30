import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { anonClient } from '@/server/database/clients';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const { data, error } = await anonClient().from('opportunity_types').select('id,slug,title_uk,requires_budget').eq('active', true).order('sort_order');
    if (error) throw new ApiHttpError('server_error', error.message);
    return jsonOk({ items: data ?? [] }, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
