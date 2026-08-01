import { authedRoute } from '@/server/admin/handler';
import { callUserRpc } from '@/server/admin/rpc';
import { jsonOk } from '@/server/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export const POST = authedRoute(async ({ ctx, user }) => jsonOk(await callUserRpc(user.jwt, 'export_my_data', {}), ctx.requestId));
