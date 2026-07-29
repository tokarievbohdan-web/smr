import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { userClient } from '../database/clients';
import { ApiHttpError } from '../http';
import type { AdminContext } from '../auth/guards';

// SQLSTATE → HTTP. RPC викликається від імені користувача/адміна (його JWT),
// тож auth.uid() коректний і RPC перевіряє роль у БД (defense in depth).
export async function callRpc(client: SupabaseClient, fn: string, params: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, params);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === '42501') throw new ApiHttpError('forbidden', error.message);
    if (code === 'P0002') throw new ApiHttpError('not_found', error.message);
    if (code === 'P0001') throw new ApiHttpError('validation', error.message);
    if (code === '40001') throw new ApiHttpError('conflict', error.message);
    if (code === '23505') throw new ApiHttpError('conflict', error.message);
    throw new ApiHttpError('server_error', error.message);
  }
  return data;
}

export function callAdminRpc(admin: AdminContext, fn: string, params: Record<string, unknown>): Promise<unknown> {
  return callRpc(userClient(admin.jwt), fn, params);
}
export function callUserRpc(jwt: string, fn: string, params: Record<string, unknown>): Promise<unknown> {
  return callRpc(userClient(jwt), fn, params);
}
