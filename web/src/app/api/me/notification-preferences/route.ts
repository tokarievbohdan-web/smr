import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user }) => {
  const { data } = await userClient(user.jwt).from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
  return jsonOk(data ?? { channels: { in_app: true, push: true, email: true }, categories: {}, timezone: 'Europe/Kyiv' }, ctx.requestId);
});
export const PATCH = authedRoute(async ({ req, ctx, user }) => {
  const body = await parseJsonBody(req);
  await callUserRpc(user.jwt, 'upsert_notification_preferences', { p_patch: body });
  return jsonOk({ ok: true }, ctx.requestId);
});
