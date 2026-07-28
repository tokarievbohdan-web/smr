import 'server-only';
import { NextResponse } from 'next/server';
import type { ApiErrorCode, ApiResponse } from '@shared/contracts/api';

// HTTP-статуси для кодів помилок (локальна копія — runtime без крос-рут імпорту).
const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401, forbidden: 403, not_found: 404, validation: 400,
  conflict: 409, rate_limited: 429, server_error: 500,
};

/** Керована помилка API з HTTP-кодом. */
export class ApiHttpError extends Error {
  code: ApiErrorCode;
  details?: unknown;
  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
  get status(): number { return STATUS[this.code]; }
}

export function jsonOk<T>(data: T, requestId: string, init?: ResponseInit): NextResponse {
  const body: ApiResponse<T> = { ok: true, data, requestId };
  return NextResponse.json(body, init);
}

export function jsonError(e: unknown, requestId: string): NextResponse {
  if (e instanceof ApiHttpError) {
    const body: ApiResponse<never> = { ok: false, error: { code: e.code, message: e.message, details: e.details }, requestId };
    return NextResponse.json(body, { status: e.status });
  }
  // Невідома помилка — не розкриваємо внутрішні деталі клієнту.
  const body: ApiResponse<never> = { ok: false, error: { code: 'server_error', message: 'Internal error' }, requestId };
  return NextResponse.json(body, { status: 500 });
}
