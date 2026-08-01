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
  let q = userClient(admin.jwt).from('feedback').select('id,type,message,entity_type,entity_id,platform,app_version,screen,status,priority,user_id,created_at').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
export const POST = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callAdminRpc(admin, 'update_feedback_status', { p_id: requireUuid(b.id, 'id'), p_status: String(b.status), p_priority: b.priority ?? null });
  return jsonOk(data, ctx.requestId);
});
