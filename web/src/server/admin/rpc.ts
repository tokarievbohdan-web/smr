import 'server-only';
import { userClient } from '../database/clients';
import { ApiHttpError } from '../http';
import type { AdminContext } from '../auth/guards';

// Викликаємо RPC від імені адміна (його JWT), тож усередині БД auth.uid()=адмін,
// і RPC ще раз перевіряє роль (defense in depth). SQLSTATE мапимо у HTTP.
export async function callAdminRpc(admin: AdminContext, fn: string, params: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await userClient(admin.jwt).rpc(fn, params);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === '42501') throw new ApiHttpError('forbidden', error.message);
    if (code === 'P0002') throw new ApiHttpError('not_found', error.message);
    throw new ApiHttpError('server_error', error.message);
  }
  return data;
}
