import { NextResponse } from 'next/server';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
// Liveness: процес живий. Без важких запитів.
export function GET() { return NextResponse.json({ ok: true, status: 'live', time: new Date().toISOString() }); }
