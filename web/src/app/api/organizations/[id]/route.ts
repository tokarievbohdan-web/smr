import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Оновити організацію (owner/editor — перевірка в RPC).
export const PATCH = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const expected = body.expectedVersion != null ? Number(body.expectedVersion) : null;
  const patch = { ...body }; delete (patch as Record<string, unknown>).expectedVersion;
  const data = await callUserRpc(user.jwt, 'update_organization', { p_id: id, p_patch: patch, p_expected_version: expected, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
