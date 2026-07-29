import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { requireUser } from '@/server/auth/guards';
import { userClient } from '@/server/database/clients';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, routeCtx: { params: Promise<{ entityType: string; entityId: string }> }) {
  const ctx = buildRequestContext(req);
  try {
    const user = await requireUser(req);
    const { entityType, entityId } = await routeCtx.params;
    const { error } = await userClient(user.jwt).from('bookmarks').delete()
      .eq('user_id', user.id).eq('entity_type', entityType).eq('entity_id', entityId);
    if (error) throw new ApiHttpError('server_error', error.message);
    return jsonOk({ removed: true, entityType, entityId }, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
