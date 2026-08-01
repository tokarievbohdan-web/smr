import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { getAdminEvent } from '@/server/events/queries';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('event_manager', async ({ ctx, admin, params }) => {
  const data = await getAdminEvent(admin.jwt, params.id);
  if (!data) throw new ApiHttpError('not_found', 'event');
  return jsonOk(data, ctx.requestId);
});
