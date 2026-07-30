import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'submit_introduction_feedback', { p_id: id, p_outcome: optionalString(body.outcome, 'outcome', 60) ?? 'unknown', p_comment: optionalString(body.comment, 'comment', 2000) ?? null, p_next: optionalString(body.nextStep, 'nextStep', 500) ?? null, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
