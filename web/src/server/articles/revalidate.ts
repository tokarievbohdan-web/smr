import 'server-only';
import { revalidatePath } from 'next/cache';

// Точкова ревалідація після публікації/оновлення/архіву/зміни slug.
// НЕ повний rebuild — лише зачеплені маршрути.
export function revalidateArticleRoutes(opts: { slug?: string | null; oldSlug?: string | null; featured?: boolean } = {}) {
  const paths = ['/review'];
  if (opts.slug) paths.push(`/review/${opts.slug}`);
  if (opts.oldSlug && opts.oldSlug !== opts.slug) paths.push(`/review/${opts.oldSlug}`);
  if (opts.featured) paths.push('/');
  for (const p of paths) { try { revalidatePath(p); } catch { /* поза request-контекстом — ігноруємо */ } }
}
