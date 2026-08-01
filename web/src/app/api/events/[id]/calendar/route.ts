import type { NextRequest } from 'next/server';
import { getBearerToken } from '@/server/auth/guards';
import { getEventBySlug } from '@/server/events/queries';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';

function ics(v: string) { return String(v).replace(/[\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n'); }
function dt(iso: string) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

// Публічний .ics (лише публічні поля; приватний online-лінк не включаємо).
export async function GET(req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) {
  const { id } = await routeCtx.params;
  const e = await getEventBySlug(getBearerToken(req), id, null) as Record<string, unknown> | null;
  if (!e || !e.starts_at) return new Response('not found', { status: 404 });
  const url = `${req.nextUrl.origin}/events/${e.slug ?? id}`;
  const loc = [e.venue_name, e.address, e.city].filter(Boolean).join(', ') || (e.online_platform as string) || '';
  const end = (e.ends_at as string) || new Date(new Date(e.starts_at as string).getTime() + 2 * 3600e3).toISOString();
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SMR//Events//UK', 'BEGIN:VEVENT',
    `UID:${id}@sportmarketreview`, `DTSTART:${dt(e.starts_at as string)}`, `DTEND:${dt(end)}`,
    `SUMMARY:${ics(e.title as string)}`, `DESCRIPTION:${ics((e.short_desc as string) || '')}`,
    `LOCATION:${ics(loc)}`, `URL:${url}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return new Response(body, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="event-${e.slug ?? id}.ics"` } });
}
