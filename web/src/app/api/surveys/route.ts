import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
// In-product survey (§33): короткий контекстний відгук.
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const data = await callUserRpc(user.jwt, 'submit_survey_response', {
    p_context: String(b.context ?? 'general'), p_question: b.question ?? null,
    p_rating: b.rating != null ? Number(b.rating) : null, p_answer: b.answer ?? null,
    p_entity_type: b.entityType ?? null, p_entity_id: b.entityId ?? null,
  });
  return jsonOk(data, ctx.requestId);
});
