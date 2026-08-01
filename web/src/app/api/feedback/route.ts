import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'submit_feedback', {
    p_type: String(b.type ?? 'other'), p_message: String(b.message ?? ''),
    p_entity_type: b.entityType ?? null, p_entity_id: b.entityId ?? null,
    p_app_version: b.appVersion ?? null, p_platform: b.platform ?? 'web', p_screen: b.screen ?? null,
  });
  return jsonOk(data, ctx.requestId);
});
