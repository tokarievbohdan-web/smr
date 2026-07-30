import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const response = optionalString(body.response, 'response', 4000);
  if (!response) throw new ApiHttpError('validation', 'response required');
  const data = await callUserRpc(user.jwt, 'submit_introduction_information', { p_id: id, p_response: response, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
