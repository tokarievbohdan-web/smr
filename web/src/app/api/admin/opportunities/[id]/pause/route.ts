import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { requireUuid } from '@/server/validation/input';
import { revalidateArticleRoutes } from '@/server/articles/revalidate';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('moderator', async ({ ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const data = await callAdminRpc(admin, 'pause_opportunity', { p_id: id, p_request_id: ctx.requestId });
  revalidateArticleRoutes({});
  return jsonOk(data, ctx.requestId);
});
