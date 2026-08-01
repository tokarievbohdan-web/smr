import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'register_for_event', {
    p_event: params.id, p_answers: body.answers ?? null,
    p_share_profile: !!body.shareProfile, p_share_list: !!body.shareList, p_source: 'web', p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
