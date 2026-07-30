import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('partnership_manager', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const pub = optionalString(body.publicReason, 'publicReason', 1000);
  if (!pub) throw new ApiHttpError('validation', 'publicReason required');
  const data = await callAdminRpc(admin, 'decline_introduction_request', { p_id: id, p_public_reason: pub, p_internal_reason: optionalString(body.internalReason, 'internalReason', 2000) ?? null, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
