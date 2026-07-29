import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const data = await callUserRpc(user.jwt, 'submit_opportunity_for_moderation', { p_id: id, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
