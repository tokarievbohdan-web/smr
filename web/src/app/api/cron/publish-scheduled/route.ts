import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { serviceClient } from '@/server/database/clients';
import { revalidateArticleRoutes } from '@/server/articles/revalidate';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Викликається зовнішнім cron (VPS/Supabase scheduled) з секретом у заголовку.
// Публікує заплановані матеріали (RPC ідемпотентний). НЕ покладається на браузер.
export async function POST(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const secret = process.env.CRON_SECRET || '';
    if (!secret || req.headers.get('x-cron-secret') !== secret) {
      throw new ApiHttpError('unauthorized', 'Invalid cron secret');
    }
    const { data, error } = await serviceClient().rpc('publish_due_scheduled');
    if (error) throw new ApiHttpError('server_error', error.message);
    const published = (data as { published?: number })?.published ?? 0;
    if (published > 0) revalidateArticleRoutes({ featured: true });
    return jsonOk({ published }, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
