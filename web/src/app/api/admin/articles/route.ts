import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = (req: NextRequest) => adminPreflight(req);

const ADMIN_SELECT =
  'id,slug,type,status,title,featured,partner_material,published_at,scheduled_at,archived_at,updated_at,views,saves,version,' +
  'author:authors(name,slug),category:article_categories(title,slug)';

// Список матеріалів для CMS (усі статуси; RLS is_admin бачить усе).
export const GET = adminRoute('editor', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get('limit') || 25), 1), 100);
  const offset = Math.max(Number(sp.get('offset') || 0), 0);
  let q = userClient(admin.jwt).from('articles').select(ADMIN_SELECT, { count: 'estimated' }).is('deleted_at', null);
  if (sp.get('status')) q = q.eq('status', sp.get('status'));
  if (sp.get('type')) q = q.eq('type', sp.get('type'));
  if (sp.get('featured')) q = q.eq('featured', sp.get('featured') === '1');
  if (sp.get('q')) q = q.textSearch('tsv', sp.get('q') as string, { type: 'websearch', config: 'simple' });
  q = q.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [], total: count ?? null, limit, offset }, ctx.requestId);
});

// Створити чернетку.
export const POST = adminRoute('editor', async ({ req, ctx, admin }) => {
  const body = await parseJsonBody(req);
  const data = await callAdminRpc(admin, 'create_article_draft', { p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
