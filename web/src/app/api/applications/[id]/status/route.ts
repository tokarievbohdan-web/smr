import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const ALLOWED = new Set(['viewed','shortlisted','contacted','accepted','rejected']);
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const status = typeof body.status === 'string' ? body.status : '';
  if (!ALLOWED.has(status)) throw new ApiHttpError('validation', 'invalid status');
  const data = await callUserRpc(user.jwt, 'change_application_status', { p_id: id, p_to: status, p_reason: optionalString(body.reason,'reason',1000) ?? null, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
