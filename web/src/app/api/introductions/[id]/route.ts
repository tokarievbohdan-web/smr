import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getIntroduction } from '@/server/introductions/queries';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const d = await getIntroduction(user.jwt, id);
  if (!d) throw new ApiHttpError('not_found', 'Introduction not found');
  return jsonOk(d, ctx.requestId);
});
export const PATCH = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const expected = body.expectedVersion != null ? Number(body.expectedVersion) : null;
  const patch = { ...body }; delete (patch as Record<string, unknown>).expectedVersion;
  const data = await callUserRpc(user.jwt, 'update_introduction_draft', { p_id: id, p_patch: patch, p_expected_version: expected, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
