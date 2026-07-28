import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const POST = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const body = await parseJsonBody(req);
  const orgId = requireUuid((body as Record<string, unknown>).orgId, 'orgId');
  const data = await callAdminRpc(admin, 'admin_verify_organization', {
    p_org_id: orgId, p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
