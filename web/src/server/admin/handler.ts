import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { AdminRole } from '@shared/contracts/status';
import { ADMIN_ORIGIN } from '../env';
import { requireAdminRole, type AdminContext } from '../auth/guards';
import { buildRequestContext, serverLog, type RequestContext } from '../auth/context';
import { jsonError, ApiHttpError } from '../http';
import { checkRateLimit } from './rateLimit';

// CORS: у production дозволяємо лише ADMIN_ORIGIN. Bearer перевіряється незалежно
// від origin, тож CORS — додатковий, а не єдиний бар'єр.
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allow = ADMIN_ORIGIN && origin === ADMIN_ORIGIN ? origin : '';
  const h: Record<string, string> = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  if (allow) h['Access-Control-Allow-Origin'] = allow;
  return h;
}

/** Preflight. */
export function adminPreflight(req: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

type RouteCtx = { params?: Promise<Record<string, string>> } | undefined;
type Handler = (args: { req: NextRequest; ctx: RequestContext; admin: AdminContext; params: Record<string, string> }) => Promise<NextResponse>;

/**
 * Обгортка адміністративного ендпоінта:
 *  request context → rate limit → verify JWT → require role → handler → структурні помилки → CORS.
 * Пробрасывает route-параметри ([id] тощо) у handler.
 */
export function adminRoute(role: AdminRole, handler: Handler) {
  return async (req: NextRequest, routeCtx?: RouteCtx): Promise<NextResponse> => {
    const ctx = buildRequestContext(req);
    const cors = corsHeaders(req);
    try {
      const admin = await requireAdminRole(req, role);
      const rl = checkRateLimit(`admin:${admin.id}`);
      if (!rl.allowed) throw new ApiHttpError('rate_limited', 'Too many requests');
      const params = routeCtx?.params ? await routeCtx.params : {};
      const res = await handler({ req, ctx, admin, params });
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      res.headers.set('x-request-id', ctx.requestId);
      return res;
    } catch (e) {
      serverLog(ctx, 'warn', 'admin route error', { err: e instanceof Error ? e.message : String(e) });
      const res = jsonError(e, ctx.requestId);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      res.headers.set('x-request-id', ctx.requestId);
      return res;
    }
  };
}
