import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { getAdminIntroductions } from '@/server/introductions/queries';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('partnership_manager', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  const items = await getAdminIntroductions(admin.jwt, { status: sp.get('status'), manager: sp.get('manager') });
  return jsonOk({ items }, ctx.requestId);
});
