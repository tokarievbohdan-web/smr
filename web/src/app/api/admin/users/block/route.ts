import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const POST = adminRoute('moderator', async ({ req, ctx, admin }) => {
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const profileId = requireUuid(body.profileId, 'profileId');
  const reason = optionalString(body.reason, 'reason', 500);
  const data = await callAdminRpc(admin, 'admin_block_user', {
    p_profile_id: profileId, p_reason: reason ?? null, p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
