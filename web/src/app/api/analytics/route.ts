import type { NextRequest } from 'next/server';
import { buildRequestContext } from '@/server/auth/context';
import { getBearerToken, requireUser } from '@/server/auth/guards';
import { anonClient, userClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, jsonError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['article_viewed', 'article_saved', 'article_unsaved', 'article_shared', 'article_search_result_opened']);

// Базова аналітика подій. Не блокує основну дію; body статті НЕ пишемо у metadata.
export async function POST(req: NextRequest) {
  const ctx = buildRequestContext(req);
  try {
    const body = (await parseJsonBody(req)) as Record<string, unknown>;
    const event = typeof body.eventName === 'string' ? body.eventName : '';
    if (!ALLOWED.has(event)) return jsonOk({ ignored: true }, ctx.requestId);

    const jwt = getBearerToken(req);
    let userId: string | null = null;
    let db = anonClient();
    if (jwt) { try { const u = await requireUser(req); userId = u.id; db = userClient(u.jwt); } catch { /* анонім */ } }

    // безпечний props (без токенів/приватного профілю/тіла статті)
    const props = {
      entity_type: typeof body.entityType === 'string' ? body.entityType : null,
      entity_id: typeof body.entityId === 'string' ? body.entityId : null,
      platform: typeof body.platform === 'string' ? body.platform : 'web',
      session_id: typeof body.sessionId === 'string' ? body.sessionId : null,
    };
    await db.from('analytics_events').insert({ user_id: userId, event, props });
    return jsonOk({ recorded: true }, ctx.requestId);
  } catch (e) {
    return jsonError(e, ctx.requestId);
  }
}
