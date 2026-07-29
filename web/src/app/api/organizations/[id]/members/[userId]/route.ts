import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES = new Set(['owner', 'manager', 'editor', 'member']);

// Змінити роль учасника (RPC перевіряє is_org_manager + захист останнього owner).
export const PATCH = authedRoute(async ({ req, ctx, user, params }) => {
  const org = requireUuid(params.id, 'id');
  const target = requireUuid(params.userId, 'userId');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const role = typeof body.role === 'string' ? body.role : '';
  if (!ROLES.has(role)) throw new ApiHttpError('validation', 'invalid role');
  const data = await callUserRpc(user.jwt, 'change_organization_member_role', { p_org: org, p_user: target, p_role: role, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});

// Видалити учасника.
export const DELETE = authedRoute(async ({ ctx, user, params }) => {
  const org = requireUuid(params.id, 'id');
  const target = requireUuid(params.userId, 'userId');
  const data = await callUserRpc(user.jwt, 'remove_organization_member', { p_org: org, p_user: target, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
