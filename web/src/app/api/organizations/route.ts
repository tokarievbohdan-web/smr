import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Створити чернетку організації (автор → owner).
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const body = await parseJsonBody(req);
  const data = await callUserRpc(user.jwt, 'create_organization_draft', { p_patch: body, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
