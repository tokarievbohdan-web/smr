import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getOrgEvents } from '@/server/events/queries';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) =>
  jsonOk({ items: await getOrgEvents(user.jwt, params.id) }, ctx.requestId));
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'create_event_draft', { p_org: params.id, p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
