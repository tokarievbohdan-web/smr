import { createHash } from 'node:crypto';
import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
// Код хешується ТУТ (sha256); БД зберігає лише хеш, raw код нікуди не логується.
export const POST = authedRoute(async ({ req, ctx, user }) => {
  const b = (await parseJsonBody(req)) as Record<string, unknown>;
  const code = String(b.code ?? '').trim();
  const hash = code ? createHash('sha256').update(code).digest('hex') : null;
  const data = await callUserRpc(user.jwt, 'redeem_beta_invitation', { p_code_hash: hash, p_email: b.email ?? null });
  return jsonOk(data, ctx.requestId);
});
