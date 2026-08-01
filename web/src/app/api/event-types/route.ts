import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { anonClient } from '@/server/database/clients';
import { jsonOk, jsonError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const { data, error } = await anonClient().from('event_types').select('id,slug,title_uk,supports_registration,default_duration_minutes,sort_order').eq('active', true).order('sort_order');
    if (error) throw error;
    return jsonOk({ items: data ?? [] }, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
