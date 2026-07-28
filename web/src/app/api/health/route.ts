import { NextResponse } from 'next/server';
import { DATA_MODE, isSupabaseConfigured } from '@/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Публічний health-check. Не розкриває секретів — лише режим і факт наявності конфігу.
export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'smr-web',
    dataMode: DATA_MODE,
    supabaseConfigured: isSupabaseConfigured,
    time: new Date().toISOString(),
  });
}
