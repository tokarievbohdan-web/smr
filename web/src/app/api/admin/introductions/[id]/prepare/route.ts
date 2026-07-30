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
  const message = optionalString(body.message, 'message', 8000);
  if (!message) throw new ApiHttpError('validation', 'message required');
  const data = await callAdminRpc(admin, 'prepare_introduction', { p_id: id, p_message: message, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
