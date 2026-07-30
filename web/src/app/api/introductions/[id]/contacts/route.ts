import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const data = await callUserRpc(user.jwt, 'get_introduction_contacts', { p_id: id });
  return jsonOk(data, ctx.requestId);
});
