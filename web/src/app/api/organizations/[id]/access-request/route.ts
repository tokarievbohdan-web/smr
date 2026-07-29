import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Запит доступу до організації.
export const POST = authedRoute(async ({ req, ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const role = typeof body.role === 'string' ? body.role : 'member';
  const data = await callUserRpc(user.jwt, 'create_org_access_request', {
    p_org: id, p_role: role,
    p_job: optionalString(body.jobTitle, 'jobTitle', 200) ?? null,
    p_reason: optionalString(body.reason, 'reason', 1000) ?? null,
    p_proof: optionalString(body.proofUrl, 'proofUrl', 500) ?? null,
    p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
