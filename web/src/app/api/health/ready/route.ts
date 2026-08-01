import { NextResponse } from 'next/server';
import { DATA_MODE, isSupabaseConfigured } from '@/server/env';
import { anonClient } from '@/server/database/clients';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
// Readiness: конфіг + легка перевірка БД (без важких запитів, без секретів).
export async function GET() {
  const checks: Record<string, boolean> = { config: DATA_MODE !== 'supabase' || isSupabaseConfigured };
  let dbOk = true;
  if (DATA_MODE === 'supabase') {
    try { const { error } = await anonClient().from('event_types').select('id', { head: true, count: 'estimated' }).limit(1); dbOk = !error; }
    catch { dbOk = false; }
  }
  checks.database = dbOk;
  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok: ready, status: ready ? 'ready' : 'not_ready', checks, time: new Date().toISOString() }, { status: ready ? 200 : 503 });
}
