import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { userClient } from '@/server/database/clients';
import { requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

export const GET = adminRoute('editor', async ({ ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const { data, error } = await userClient(admin.jwt).from('article_revisions')
    .select('id,revision_number,reason,created_by,created_at')
    .eq('article_id', id).order('revision_number', { ascending: false });
  if (error) throw new ApiHttpError('server_error', error.message);
  return jsonOk({ items: data ?? [] }, ctx.requestId);
});
