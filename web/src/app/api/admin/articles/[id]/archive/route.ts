import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { requireUuid } from '@/server/validation/input';
import { revalidateArticleRoutes } from '@/server/articles/revalidate';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const POST = adminRoute('editor', async ({ ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const { data: row } = await userClient(admin.jwt).from('articles').select('slug').eq('id', id).maybeSingle();
  const data = await callAdminRpc(admin, 'archive_article', { p_id: id, p_request_id: ctx.requestId });
  revalidateArticleRoutes({ slug: row?.slug, featured: true });   // прибрати з фіду/головної
  return jsonOk(data, ctx.requestId);
});
