import { authedRoute } from '@/server/admin/handler';
import { getMyApplications } from '@/server/opportunities/queries';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user }) => {
  const items = await getMyApplications(user.jwt, user.id);
  return jsonOk({ items }, ctx.requestId);
});
