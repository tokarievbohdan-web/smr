import 'server-only';
import type { NextRequest } from 'next/server';

// Контекст запиту для audit/логів/rate-limit. request_id генерується тут і
// прокидається у RPC (p_request_id) та у відповідь.

export interface RequestContext {
  requestId: string;
  ip: string | null;
  userAgent: string | null;
}

export function buildRequestContext(req: NextRequest): RequestContext {
  return {
    requestId: (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}`),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
  };
}

/** Безпечне логування на сервері (без токенів/секретів). */
export function serverLog(ctx: RequestContext, level: 'info' | 'warn' | 'error', msg: string, extra?: Record<string, unknown>) {
  const line = { t: new Date().toISOString(), level, requestId: ctx.requestId, msg, ...sanitize(extra) };
  // eslint-disable-next-line no-console
  console[level === 'info' ? 'log' : level](JSON.stringify(line));
}

function sanitize(extra?: Record<string, unknown>): Record<string, unknown> {
  if (!extra) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extra)) {
    if (/token|secret|key|password|authorization|otp/i.test(k)) { out[k] = '[redacted]'; continue; }
    out[k] = v;
  }
  return out;
}
