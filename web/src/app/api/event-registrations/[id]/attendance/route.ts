import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  void body;
  const data = await callUserRpc(user.jwt, 'mark_event_attendance', Object.assign({ p_request_id: ctx.requestId }, { p_reg: params.id, p_state: String(body.state ?? 'attended') }));
  return jsonOk(data, ctx.requestId);
});
