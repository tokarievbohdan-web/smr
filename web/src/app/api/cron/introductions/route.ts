import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { serviceClient } from '@/server/database/clients';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const secret = process.env.CRON_SECRET || '';
    if (!secret || req.headers.get('x-cron-secret') !== secret) throw new ApiHttpError('unauthorized', 'Invalid cron secret');
    const { data, error } = await serviceClient().rpc('introductions_cron');
    if (error) throw new ApiHttpError('server_error', error.message);
    return jsonOk(data, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
