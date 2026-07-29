import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['approve', 'reject', 'request_information']);

// Розгляд запиту доступу власником/менеджером організації (RPC перевіряє is_org_manager).
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action : '';
  if (!ALLOWED.has(action)) throw new ApiHttpError('validation', 'invalid action');
  const role = typeof body.role === 'string' ? body.role : null;
  const note = optionalString(body.note, 'note', 1000);
  const data = await callUserRpc(user.jwt, 'admin_review_access_request', { p_id: id, p_action: action, p_role: role, p_note: note ?? null, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
