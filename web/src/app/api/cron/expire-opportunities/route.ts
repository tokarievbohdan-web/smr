import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { serviceClient } from '@/server/database/clients';
import { revalidateArticleRoutes } from '@/server/articles/revalidate';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cron: переводить прострочені можливості у expired (RPC ідемпотентний).
export async function POST(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const secret = process.env.CRON_SECRET || '';
    if (!secret || req.headers.get('x-cron-secret') !== secret) throw new ApiHttpError('unauthorized', 'Invalid cron secret');
    const { data, error } = await serviceClient().rpc('expire_opportunities');
    if (error) throw new ApiHttpError('server_error', error.message);
    const expired = (data as { expired?: number })?.expired ?? 0;
    if (expired > 0) revalidateArticleRoutes({});
    return jsonOk({ expired }, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
