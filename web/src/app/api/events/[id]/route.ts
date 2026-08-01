import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken, requireUser } from '@/server/auth/guards';
import { getEventBySlug } from '@/server/events/queries';
import { callUserRpc } from '@/server/admin/rpc';
import { authedRoute } from '@/server/admin/handler';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, jsonError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const { id } = await routeCtx.params;
    const u = getBearerToken(req) ? await requireUser(req).catch(() => null) : null;
    const data = await getEventBySlug(getBearerToken(req), id, u?.id ?? null);
    if (!data) return jsonError(Object.assign(new Error('not_found'), { code: 'not_found' }), ctx.requestId);
    return jsonOk(data, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}
export const PATCH = authedRoute(async ({ req, ctx, user, params }) => {
  const body = await parseJsonBody(req);
  const data = await callUserRpc(user.jwt, 'update_event_draft', { p_id: params.id, p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
