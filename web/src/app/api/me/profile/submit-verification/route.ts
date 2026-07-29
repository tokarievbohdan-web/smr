import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = authedRoute(async ({ ctx, user }) => {
  const data = await callUserRpc(user.jwt, 'submit_profile_for_verification', { p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
