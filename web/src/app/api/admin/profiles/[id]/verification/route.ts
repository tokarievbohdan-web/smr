import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

const ALLOWED = new Set(['verified', 'rejected', 'changes_required', 'pending', 'unverified']);

// Встановити статус верифікації профілю (approve/verify/reject/changes).
export const POST = adminRoute('moderator', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const status = typeof body.status === 'string' ? body.status : '';
  if (!ALLOWED.has(status)) throw new ApiHttpError('validation', 'invalid status');
  const note = optionalString(body.note, 'note', 1000);
  const data = await callAdminRpc(admin, 'admin_set_profile_verification', { p_id: id, p_status: status, p_note: note ?? null, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
