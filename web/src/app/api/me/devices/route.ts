import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'register_device', {
    p_platform: String(b.platform ?? 'web'), p_push_token: String(b.pushToken ?? ''),
    p_device_id: b.deviceId ?? null, p_app_version: b.appVersion ?? null, p_environment: b.environment ?? 'production',
  });
  return jsonOk(data, ctx.requestId);
});
export const DELETE = authedRoute(async ({ req, ctx, user }) => {
  const id = req.nextUrl.searchParams.get('id');
  const data = id ? await callUserRpc(user.jwt, 'invalidate_device', { p_device_id: requireUuid(id, 'id') })
                  : await callUserRpc(user.jwt, 'invalidate_my_devices', {});
  return jsonOk(data, ctx.requestId);
});
