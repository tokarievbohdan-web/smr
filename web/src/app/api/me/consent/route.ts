import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'record_consent', { p_type: String(b.type), p_version: String(b.version ?? '1'), p_source: b.source ?? 'web' });
  return jsonOk(data, ctx.requestId);
});
export const DELETE = authedRoute(async ({ req, ctx, user }) => {
  const t = req.nextUrl.searchParams.get('type') || '';
  const data = await callUserRpc(user.jwt, 'revoke_consent', { p_type: t });
  return jsonOk(data, ctx.requestId);
});
