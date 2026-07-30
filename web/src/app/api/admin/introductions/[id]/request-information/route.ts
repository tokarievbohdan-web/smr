import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { parseJsonBody, requireUuid, optionalString } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);
export const POST = adminRoute('partnership_manager', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const question = optionalString(body.question, 'question', 2000);
  if (!question) throw new ApiHttpError('validation', 'question required');
  const data = await callAdminRpc(admin, 'request_introduction_information', { p_id: id, p_question: question, p_request_id: ctx.requestId });
  return jsonOk(data, ctx.requestId);
});
