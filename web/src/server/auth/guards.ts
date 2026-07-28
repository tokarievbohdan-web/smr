import 'server-only';
import type { NextRequest } from 'next/server';
import type { AdminRole } from '@shared/contracts/status';
import { anonClient, serviceClient } from '../database/clients';
import { ApiHttpError } from '../http';

export interface AuthedUser { id: string; email: string | null; jwt: string; }
export interface AdminContext extends AuthedUser { role: AdminRole; }

/** Витягти Bearer-токен із заголовка Authorization. */
export function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

/** Перевірити JWT через Supabase Auth. Кидає 401, якщо невалідний. */
export async function requireUser(req: NextRequest): Promise<AuthedUser> {
  const jwt = getBearerToken(req);
  if (!jwt) throw new ApiHttpError('unauthorized', 'Missing bearer token');
  const { data, error } = await anonClient().auth.getUser(jwt);
  if (error || !data?.user) throw new ApiHttpError('unauthorized', 'Invalid or expired token');
  return { id: data.user.id, email: data.user.email ?? null, jwt };
}

/**
 * Отримати активну admin-роль користувача із СЕРВЕРНОЇ таблиці admin_users
 * (через service-role, щоб оминути RLS без рекурсії). suspended/deleted → null.
 * Роль НЕ береться з JWT/app_metadata.
 */
export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const { data, error } = await serviceClient()
    .from('admin_users')
    .select('role,status,deleted_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status !== 'active' || data.deleted_at != null) return null;
  return data.role as AdminRole;
}

/** Вимагати будь-яку активну admin-роль. Кидає 403 інакше. */
export async function requireAdmin(req: NextRequest): Promise<AdminContext> {
  const user = await requireUser(req);
  const role = await getAdminRole(user.id);
  if (!role) throw new ApiHttpError('forbidden', 'Admin role required');
  return { ...user, role };
}

/** Вимагати конкретну роль (super_admin проходить завжди). */
export async function requireAdminRole(req: NextRequest, needed: AdminRole): Promise<AdminContext> {
  const ctx = await requireAdmin(req);
  if (ctx.role !== 'super_admin' && ctx.role !== needed) {
    throw new ApiHttpError('forbidden', `Role '${needed}' required`);
  }
  return ctx;
}
