import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const status = req.nextUrl.searchParams.get('status');
  let q = userClient(admin.jwt).from('business_outcomes').select('id,outcome_type,source_module,participants,organizations,outcome_date,status,short_description,verification_source,permission_for_public_use,created_at').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
export const POST = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = b.id
    ? await callAdminRpc(admin, 'update_business_outcome', { p_id: requireUuid(b.id, 'id'), p_status: b.status ?? null, p_permission: b.permission ?? null })
    : await callAdminRpc(admin, 'record_business_outcome', { p_patch: b });
  return jsonOk(data, ctx.requestId);
});
