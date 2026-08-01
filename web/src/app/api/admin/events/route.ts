import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { getAdminEvents } from '@/server/events/queries';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('event_manager', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  const items = await getAdminEvents(admin.jwt, { moderation: sp.get('moderation'), business: sp.get('business'), format: sp.get('format'), q: sp.get('q') });
  return jsonOk({ items }, ctx.requestId);
});
