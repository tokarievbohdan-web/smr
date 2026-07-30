import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getMyIntroductions } from '@/server/introductions/queries';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user }) => jsonOk(await getMyIntroductions(user.jwt, user.id), ctx.requestId));
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const body = await parseJsonBody(req);
  const data = await callUserRpc(user.jwt, 'create_introduction_draft', { p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
