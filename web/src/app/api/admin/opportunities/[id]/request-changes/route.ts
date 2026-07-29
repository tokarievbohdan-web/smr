import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('moderator', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const reason = optionalString(body.reason, 'reason', 1000);
  if (!reason) throw new ApiHttpError('validation', 'reason required');
  const data = await callAdminRpc(admin, 'request_opportunity_changes', { p_id: id, p_reason: reason, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
