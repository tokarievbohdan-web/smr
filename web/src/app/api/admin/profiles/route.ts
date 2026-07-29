import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

// Черга профілів для модерації/верифікації (is_admin бачить усе).
export const GET = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get('limit') || 30), 1), 100);
  const offset = Math.max(Number(sp.get('offset') || 0), 0);
  let q = userClient(admin.jwt).from('profiles')
    .select('id,email,display_name,first_name,last_name,city,verification_status,moderation_status,status,verification_submitted_at,created_at', { count: 'estimated' })
    .is('deleted_at', null);
  if (sp.get('verification')) q = q.eq('verification_status', sp.get('verification'));
  if (sp.get('status')) q = q.eq('status', sp.get('status'));
  if (sp.get('city')) q = q.eq('city', sp.get('city'));
  if (sp.get('q')) q = q.textSearch('tsv', sp.get('q') as string, { type: 'websearch', config: 'simple' });
  q = q.order('verification_submitted_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [], total: count ?? null, limit, offset }, ctx.requestId);
});
