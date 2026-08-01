import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('event_manager', async ({ req, ctx, admin, params }) => {
  const body = (await parseJsonBody(req).catch(() => ({}))) as Record<string, unknown>;
  void body;
  const data = await callAdminRpc(admin, 'publish_event', Object.assign({ p_request_id: ctx.requestId }, { p_id: params.id }));
  return jsonOk(data, ctx.requestId);
});
