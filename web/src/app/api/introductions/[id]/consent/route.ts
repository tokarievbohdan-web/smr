import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const shared = { email: body.shareEmail === true, phone: body.sharePhone === true };
  const data = await callUserRpc(user.jwt, 'respond_target_consent', { p_id: id, p_accept: body.accept === true, p_message: optionalString(body.message, 'message', 2000) ?? null, p_shared: shared, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
