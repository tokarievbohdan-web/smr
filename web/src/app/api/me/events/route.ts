import { authedRoute } from '@/server/admin/handler';
import { getMyEvents } from '@/server/events/queries';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user }) => jsonOk({ items: await getMyEvents(user.jwt, user.id) }, ctx.requestId));
