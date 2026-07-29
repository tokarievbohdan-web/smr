import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getOrgOpportunities } from '@/server/opportunities/queries';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = authedRoute(async ({ ctx, user, params }) => {
  const org = requireUuid(params.id, 'id');
  const items = await getOrgOpportunities(user.jwt, org);
  return jsonOk({ items }, ctx.requestId);
});

export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const org = requireUuid(params.id, 'id');
  const body = await parseJsonBody(req);
  const data = await callUserRpc(user.jwt, 'create_opportunity_draft', { p_org: org, p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
