import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { revalidateArticleRoutes } from '@/server/articles/revalidate';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

const ALLOWED = new Set(['draft', 'pending', 'changes_required', 'approved', 'rejected', 'archived']);

export const POST = adminRoute('moderator', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const status = typeof body.status === 'string' ? body.status : '';
  if (!ALLOWED.has(status)) throw new ApiHttpError('validation', 'invalid status');
  const note = optionalString(body.note, 'note', 1000);
  const data = await callAdminRpc(admin, 'admin_set_org_moderation', { p_id: id, p_status: status, p_note: note ?? null, p_request_id: ctx.requestId });
  revalidateArticleRoutes({}); // оновити мережеві сторінки (директорію)
  return jsonOk(data, ctx.requestId);
});
