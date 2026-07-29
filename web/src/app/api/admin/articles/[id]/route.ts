import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { callAdminRpc } from '@/server/admin/rpc';
import { userClient } from '@/server/database/clients';
import { parseJsonBody, requireUuid } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = (req: NextRequest) => adminPreflight(req);

// Повний матеріал для редактора (усі поля; RLS is_admin).
export const GET = adminRoute('editor', async ({ ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const { data, error } = await userClient(admin.jwt).from('articles')
    .select('*,author:authors(id,name,slug),category:article_categories(id,title,slug),tags:article_tag_links(article_tags(id,name,slug))')
    .eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw new ApiHttpError('server_error', error.message);
  if (!data) throw new ApiHttpError('not_found', 'Article not found');
  return jsonOk(data, ctx.requestId);
});

// Оновити чернетку (optimistic concurrency: expectedVersion).
export const PATCH = adminRoute('editor', async ({ req, ctx, admin, params }) => {
  const id = requireUuid(params.id, 'id');
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const expected = body.expectedVersion != null ? Number(body.expectedVersion) : null;
  const patch = { ...body }; delete (patch as Record<string, unknown>).expectedVersion;
  const data = await callAdminRpc(admin, 'update_article_draft', {
    p_id: id, p_patch: patch, p_expected_version: expected, p_request_id: ctx.requestId,
  });
  return jsonOk(data, ctx.requestId);
});
