import { authedRoute } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = authedRoute(async ({ ctx, user }) => {
  const { data, error } = await userClient(user.jwt).from('access_requests')
    .select('id,org_id,requested_role,job_title,status,created_at,resolved_at,organization:organizations(name,slug)')
    .eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
