import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const DELETE = authedRoute(async ({ ctx, user }) => jsonOk(await callUserRpc(user.jwt, 'request_account_deletion', { p_grace_days: 30 }), ctx.requestId));
export const POST = authedRoute(async ({ ctx, user }) => jsonOk(await callUserRpc(user.jwt, 'cancel_account_deletion', {}), ctx.requestId));
