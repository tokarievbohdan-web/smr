import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const POST = adminRoute('editor', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const when = typeof body.scheduledAt === 'string' ? body.scheduledAt : null;
  if (!when) throw new ApiHttpError('validation', 'scheduledAt (ISO) required');
  const data = await callAdminRpc(admin, 'schedule_article', { p_id: id, p_when: when, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
