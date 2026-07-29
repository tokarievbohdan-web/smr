import { authedRoute } from '@/server/admin/handler';
import { getApplication } from '@/server/opportunities/queries';
import { requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const a = await getApplication(user.jwt, id);
  if (!a) throw new ApiHttpError('not_found', 'Application not found');
  return jsonOk(a, ctx.requestId);
});
