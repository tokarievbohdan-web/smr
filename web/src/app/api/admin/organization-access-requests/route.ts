import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const GET = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const sp = req.nextUrl.searchParams;
  let q = userClient(admin.jwt).from('access_requests')
    .select('id,org_id,user_id,requested_role,job_title,reason,proof_url,status,review_note,created_at,resolved_at,organization:organizations(name,slug)');
  if (sp.get('status')) q = q.eq('status', sp.get('status'));
  q = q.order('created_at', { ascending: false }).limit(100);
  const { data, error } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
