import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const data = await callUserRpc(user.jwt, 'get_event_access', { p_event: params.id });
  return jsonOk(data, ctx.requestId);
});
