import { authedRoute } from '@/server/admin/handler';
import { getEventRegistrations } from '@/server/events/queries';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const items = await getEventRegistrations(user.jwt, params.id);
  return jsonOk({ items }, ctx.requestId);
});
