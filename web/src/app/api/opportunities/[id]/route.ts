import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken, requireUser } from '@/server/auth/guards';
import { getOpportunityBySlug } from '@/server/opportunities/queries';
import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Публічна деталь за slug (param `id` тут = slug). Опційно — стан заявки користувача.
export async function GET(req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const { id: slug } = await routeCtx.params;
    const jwt = getBearerToken(req);
    let userId: string | null = null;
    if (jwt) { try { userId = (await requireUser(req)).id; } catch { /* anon */ } }
    const o = await getOpportunityBySlug(jwt, slug, userId);
    if (!o) throw new ApiHttpError('not_found', 'Opportunity not found');
    return jsonOk(o, ctx.requestId);
  } catch (e) { return jsonError(e, ctx.requestId); }
}

// Оновлення (param `id` = uuid; RPC перевіряє org-editor + concurrency).
export const PATCH = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const expected = body.expectedVersion != null ? Number(body.expectedVersion) : null;
  const patch = { ...body }; delete (patch as Record<string, unknown>).expectedVersion;
  const data = await callUserRpc(user.jwt, 'update_opportunity', { p_id: id, p_patch: patch, p_expected_version: expected, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
