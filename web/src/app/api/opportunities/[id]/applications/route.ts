import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getOppApplications } from '@/server/opportunities/queries';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Список відгуків (workspace організації — RLS is_opp_manager).
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const items = await getOppApplications(user.jwt, id);
  return jsonOk({ items }, ctx.requestId);
});

// Подати відгук (RPC: перевірки own/dup/deadline/expired).
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'submit_opportunity_application', {
    p_opp: id,
    p_cover: optionalString(body.coverMessage, 'coverMessage', 4000) ?? null,
    p_portfolio: optionalString(body.portfolioUrl, 'portfolioUrl', 500) ?? null,
    p_attachment: typeof body.attachmentMediaId === 'string' ? body.attachmentMediaId : null,
    p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
