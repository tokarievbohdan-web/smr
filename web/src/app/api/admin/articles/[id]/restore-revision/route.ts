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
  const rev = Number(body.revisionNumber);
  if (!Number.isInteger(rev)) throw new ApiHttpError('validation', 'revisionNumber (int) required');
  const data = await callAdminRpc(admin, 'restore_article_revision', { p_id: id, p_revision: rev, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
