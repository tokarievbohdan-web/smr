import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('partnership_manager', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  void optionalString; void ApiHttpError;
  const p = { p_id: id };
  const data = await callAdminRpc(admin, 'approve_introduction_request', Object.assign({ p_request_id: ctx.requestId }, p));
  return jsonOk(data, ctx.requestId);
});
