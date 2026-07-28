import 'server-only';
import { ApiHttpError } from '../http';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Розпарсити JSON-тіло; кидає 400 при некоректному вводі. */
export async function parseJsonBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiHttpError('validation', 'Invalid JSON body');
  }
}

export function requireUuid(v: unknown, field: string): string {
  if (typeof v !== 'string' || !UUID_RE.test(v)) {
    throw new ApiHttpError('validation', `Field '${field}' must be a UUID`);
  }
  return v;
}

export function optionalString(v: unknown, field: string, max = 2000): string | undefined {
  if (v == null) return undefined;
  if (typeof v !== 'string') throw new ApiHttpError('validation', `Field '${field}' must be a string`);
  if (v.length > max) throw new ApiHttpError('validation', `Field '${field}' too long`);
  return v;
}
