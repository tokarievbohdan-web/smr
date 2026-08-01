import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const GET = adminRoute('super_admin', async ({ ctx, admin }) => {
  const { data, error } = await userClient(admin.jwt).from('beta_invitations').select('id,email,cohort,organization_id,max_uses,uses_count,status,expires_at,created_at,accepted_at').order('created_at', { ascending: false }).limit(200);
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
// Генеруємо код тут, повертаємо raw ОДИН раз (для передачі запрошеному), у БД — лише хеш.
export const POST = adminRoute('super_admin', async ({ req, ctx, admin }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const code = randomBytes(6).toString('hex').toUpperCase();
  const hash = createHash('sha256').update(code).digest('hex');
  const data = await callAdminRpc(admin, 'create_beta_invitation', {
    p_code_hash: hash, p_email: b.email ?? null, p_org: b.organizationId ?? null,
    p_cohort: b.cohort ?? null, p_max_uses: b.maxUses ?? 1, p_expires_at: b.expiresAt ?? null,
  });
  return jsonOk({ ...(data as object), code }, ctx.requestId);
});
