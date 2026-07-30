import { authedRoute } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Організації, якими користувач може керувати (owner/manager/editor).
export const GET = authedRoute(async ({ ctx, user }) => {
  const { data, error } = await userClient(user.jwt).from('organization_members')
    .select('role,organization:organizations(id,name,slug,moderation)')
    .eq('user_id', user.id).eq('status', 'active').in('role', ['owner', 'manager', 'editor']);
  if (error) throw new ApiHttpError('server_error', error.message);
  const items = (data ?? []).map((m) => ({ role: m.role, ...(m.organization as unknown as Record<string, unknown>) }));
  return jsonOk({ items }, ctx.requestId);
});
