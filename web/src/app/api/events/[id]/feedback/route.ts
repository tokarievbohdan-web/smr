import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  void body;
  const data = await callUserRpc(user.jwt, 'submit_event_feedback', Object.assign({ p_request_id: ctx.requestId }, { p_event: params.id, p_attended: body.attended ?? null, p_useful: body.useful ?? null, p_connections: body.connections ?? null, p_wants_similar: body.wantsSimilar ?? null, p_comment: body.comment ?? null }));
  return jsonOk(data, ctx.requestId);
});
