import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { requireUser } from '@/server/auth/guards';
import { userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, jsonError, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Зберегти закладку (лише свою — RLS enforced).
export async function POST(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const user = await requireUser(req);
    const body = (await parseJsonBody(req)) as Record<string, unknown>;
    const entityType = typeof body.entityType === 'string' ? body.entityType : 'article';
    const entityId = body.entityId;
    if (typeof entityId !== 'string' || !entityId) throw new ApiHttpError('validation', 'entityId required');
    const { error } = await userClient(user.jwt).from('bookmarks')
      .upsert({ user_id: user.id, entity_type: entityType, entity_id: entityId }, { onConflict: 'user_id,entity_type,entity_id' });
    if (error) throw new ApiHttpError('server_error', error.message);
    return jsonOk({ saved: true, entityType, entityId }, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
