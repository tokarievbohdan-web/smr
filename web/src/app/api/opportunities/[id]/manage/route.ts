import { authedRoute } from '@/server/admin/handler';
import { getOpportunityManage } from '@/server/opportunities/queries';
import { requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const o = await getOpportunityManage(user.jwt, id);
  if (!o) throw new ApiHttpError('not_found', 'Opportunity not found');
  return jsonOk(o, ctx.requestId);
});
