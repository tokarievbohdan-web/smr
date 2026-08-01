import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken } from '@/server/auth/guards';
import { userClient, anonClient } from '@/server/database/clients';
import { jsonOk, jsonError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
// GET /api/feature-flags?keys=a,b — стан прапорців для поточного користувача (audience-aware).
export async function GET(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const keys = (req.nextUrl.searchParams.get('keys') || '').split(',').map((s) => s.trim()).filter(Boolean);
    const jwt = getBearerToken(req);
    const db = jwt ? userClient(jwt) : anonClient();
    const out: Record<string, boolean> = {};
    for (const k of keys.slice(0, 30)) { const { data } = await db.rpc('is_feature_enabled', { p_key: k }); out[k] = !!data; }
    return jsonOk({ flags: out }, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
