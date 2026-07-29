import type { NextRequest } from 'next/server';
import { adminRoute, adminPreflight } from '@/server/admin/handler';
import { serviceClient } from '@/server/database/clients';
import { parseJsonBody } from '@/server/validation/input';
import { jsonOk, ApiHttpError } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const OPTIONS = (req: NextRequest) => adminPreflight(req);

const BUCKET = 'article-media';
const MAX_BYTES = 8 * 1024 * 1024;
// Whitelist: SVG заборонено (без sanitization).
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Створює signed-upload URL + рядок media_files. Файл клієнт вантажить напряму
// у Storage за токеном (service_role лишається на сервері).
export const POST = adminRoute('editor', async ({ req, ctx, admin }) => {
  const body = (await parseJsonBody(req)) as Record<string, unknown>;
  const mime = typeof body.mimeType === 'string' ? body.mimeType : '';
  const size = Number(body.sizeBytes || 0);
  const ext = MIME_EXT[mime];
  if (!ext) throw new ApiHttpError('validation', 'Дозволено лише JPEG/PNG/WebP');
  if (!size || size > MAX_BYTES) throw new ApiHttpError('validation', `Розмір до ${MAX_BYTES / 1024 / 1024}MB`);

  const mediaId = globalThis.crypto.randomUUID();
  const path = `articles/${mediaId}.${ext}`;
  const svc = serviceClient();

  const signed = await svc.storage.from(BUCKET).createSignedUploadUrl(path);
  if (signed.error) throw new ApiHttpError('server_error', signed.error.message);

  const { error: insErr } = await svc.from('media_files').insert({
    id: mediaId, bucket: BUCKET, path, mime_type: mime, size_bytes: size,
    is_published: true, uploaded_by: admin.id,
  });
  if (insErr) throw new ApiHttpError('server_error', insErr.message);

  const publicUrl = svc.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return jsonOk({ mediaId, bucket: BUCKET, path, token: signed.data.token, signedUrl: signed.data.signedUrl, publicUrl }, ctx.requestId);
});
