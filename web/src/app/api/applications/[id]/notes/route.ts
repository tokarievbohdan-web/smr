import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const note = optionalString(body.body, 'body', 4000);
  if (!note) throw new ApiHttpError('validation', 'body required');
  const data = await callUserRpc(user.jwt, 'add_application_note', { p_id: id, p_body: note, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
