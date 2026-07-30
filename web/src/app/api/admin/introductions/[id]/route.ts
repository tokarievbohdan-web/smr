import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { getAdminIntroduction } from '@/server/introductions/queries';
import { requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('partnership_manager', async ({ ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const d = await getAdminIntroduction(admin.jwt, id);
  if (!d) throw new ApiHttpError('not_found', 'Not found');
  return jsonOk(d, ctx.requestId);
});
