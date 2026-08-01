import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('super_admin', async ({ ctx, admin }) => {
  const { data, error } = await userClient(admin.jwt).from('feature_flags').select('key,enabled,environments,audience,description,updated_at').order('key');
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
export const POST = adminRoute('super_admin', async ({ req, ctx, admin }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callAdminRpc(admin, 'set_feature_flag', {
    p_key: String(b.key), p_enabled: !!b.enabled, p_environments: b.environments ?? [], p_audience: b.audience ?? {}, p_description: b.description ?? null,
  });
  return jsonOk(data, ctx.requestId);
});
