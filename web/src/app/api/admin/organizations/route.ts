import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const GET = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get('limit') || 30), 1), 100);
  const offset = Math.max(Number(sp.get('offset') || 0), 0);
  let q = userClient(admin.jwt).from('organizations')
    .select('id,name,slug,moderation,verification,city,owner_id,created_at,updated_at,type:organization_types(title)', { count: 'estimated' })
    .is('deleted_at', null);
  if (sp.get('moderation')) q = q.eq('moderation', sp.get('moderation'));
  if (sp.get('verification')) q = q.eq('verification', sp.get('verification'));
  if (sp.get('q')) q = q.textSearch('tsv', sp.get('q') as string, { type: 'websearch', config: 'simple' });
  q = q.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [], total: count ?? null, limit, offset }, ctx.requestId);
});
