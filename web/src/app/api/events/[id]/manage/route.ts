import { authedRoute } from '@/server/admin/handler';
import { getEventManage } from '@/server/events/queries';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const data = await getEventManage(user.jwt, params.id);
  if (!data) throw new ApiHttpError('not_found', 'event');
  return jsonOk(data, ctx.requestId);
});
