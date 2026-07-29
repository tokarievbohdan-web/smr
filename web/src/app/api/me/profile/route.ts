import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { getOwnProfile } from '@/server/network/queries';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = authedRoute(async ({ ctx, user }) => {
  const p = await getOwnProfile(user.jwt, user.id);
  return jsonOk(p, ctx.requestId);
});

export const PATCH = authedRoute(async ({ req, ctx, user }) => {
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const expected = body.expectedVersion != null ? Number(body.expectedVersion) : null;
  const patch = { ...body }; delete (patch as Record<string, unknown>).expectedVersion;
  const data = await callUserRpc(user.jwt, 'update_own_profile', { p_patch: patch, p_expected_version: expected, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
