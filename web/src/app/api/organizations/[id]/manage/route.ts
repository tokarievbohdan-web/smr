import { authedRoute } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Повні дані організації для керування (RLS: owner/editor/member/admin бачать).
export const GET = authedRoute(async ({ ctx, user, params }) => {
  const id = requireUuid(params.id, 'id');
  const db = userClient(user.jwt);
  const { data, error } = await db.from('organizations').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw new ApiHttpError('server_error', error.message);
  if (!data) throw new ApiHttpError('not_found', 'Organization not found');
  const { data: members } = await db.from('organization_members')
    .select('user_id,role,status,job_title,is_public,profile:public_profiles(display_name,avatar)')
    .eq('org_id', id).neq('status', 'removed');
  const { data: requests } = await db.from('access_requests')
    .select('id,user_id,requested_role,job_title,reason,status,created_at').eq('org_id', id);
  return jsonOk({ organization: data, members: members ?? [], accessRequests: requests ?? [] }, ctx.requestId);
});
