// Уніфіковані API-відповіді для Next.js Route Handlers і клієнтів.

export interface PaginationRequest { limit?: number; offset?: number; cursor?: string | null; }

export interface PaginatedResponse<T> {
  items: T[];
  total: number | null;   // null, якщо точний count не рахували
  limit: number;
  offset: number;
  nextCursor: string | null;
}

export interface ApiSuccess<T> { ok: true; data: T; requestId?: string; }

export interface ApiError {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ApiErrorCode =
  | 'unauthorized'      // 401 — немає/невалідний токен
  | 'forbidden'         // 403 — немає ролі/прав
  | 'not_found'         // 404
  | 'validation'        // 400 — погані вхідні дані
  | 'conflict'          // 409
  | 'rate_limited'      // 429
  | 'server_error';     // 500

export const ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 400,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
};

export function ok<T>(data: T, requestId?: string): ApiSuccess<T> {
  return { ok: true, data, requestId };
}
export function err(code: ApiErrorCode, message: string, details?: unknown, requestId?: string): ApiError {
  return { ok: false, error: { code, message, details }, requestId };
}
