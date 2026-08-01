import 'server-only';
import { DATA_MODE } from '@/server/env';
import { getEventFeed, getEventBySlug, type EventFeedParams } from '@/server/events/queries';
import { EVENTS, type EventItem } from '@/lib/data';

const FORMAT: Record<string, string> = { offline: 'Офлайн', online: 'Онлайн', hybrid: 'Гібрид', deadline_only: 'Дедлайн' };
export const formatLabel = (f: string | null) => (f ? FORMAT[f] ?? f : '');
const TICKET: Record<string, string> = { free: 'Безкоштовно', paid_external: 'Платно', invitation_only: 'За запрошенням', not_applicable: '—' };
export const ticketLabel = (t: string | null) => (t ? TICKET[t] ?? t : '');

export function spotsLabel(r: Record<string, unknown>): string {
  const cap = r.capacity == null ? null : Number(r.capacity);
  if (cap == null) return 'Без обмежень';
  const left = Math.max(cap - Number(r.registered_count ?? 0), 0);
  return left > 0 ? `${left} місць` : (r.waitlist_enabled ? 'Лист очікування' : 'Місць немає');
}

export interface EventCardData {
  id: string; slug: string; title: string; shortDesc: string | null; cover: string | null;
  typeTitle: string | null; format: string; formatKind: string; orgName: string | null; orgVerified: boolean;
  city: string | null; startsAt: string | null; timezone: string | null; ticket: string; spots: string;
  businessStatus: string; featured: boolean;
}

const mapCard = (r: Record<string, unknown>): EventCardData => ({
  id: r.id as string, slug: (r.slug as string) ?? (r.id as string), title: r.title as string,
  shortDesc: (r.short_desc as string) ?? null, cover: (r.cover as string) ?? null,
  typeTitle: (r.type_title as string) ?? null, format: formatLabel(r.format_kind as string), formatKind: (r.format_kind as string) ?? '',
  orgName: (r.org_name as string) ?? null, orgVerified: !!r.org_verified, city: (r.city as string) ?? null,
  startsAt: (r.starts_at as string) ?? null, timezone: (r.timezone as string) ?? null,
  ticket: ticketLabel(r.ticket_type as string), spots: spotsLabel(r), businessStatus: (r.business_status as string) ?? 'published', featured: !!r.featured,
});

const mockCard = (e: EventItem): EventCardData => ({
  id: e.id, slug: e.id, title: e.title, shortDesc: e.desc ?? null, cover: null, typeTitle: e.format,
  format: e.format, formatKind: e.format === 'Онлайн' ? 'online' : 'offline', orgName: e.org, orgVerified: false,
  city: e.city, startsAt: null, timezone: 'Europe/Kyiv', ticket: e.cost, spots: e.seats === 'немає' ? 'Місць немає' : e.seats,
  businessStatus: 'published', featured: false,
});

export async function listEvents(p: EventFeedParams): Promise<{ items: EventCardData[]; total: number | null }> {
  if (DATA_MODE === 'supabase') {
    const f = await getEventFeed(null, p);
    return { total: f.total, items: (f.items as unknown as Record<string, unknown>[]).map(mapCard) };
  }
  let items = EVENTS.map(mockCard);
  if (p.format) items = items.filter((i) => i.formatKind === p.format);
  if (p.city) items = items.filter((i) => i.city === p.city);
  return { items, total: items.length };
}

export interface EventDetailData extends EventCardData {
  fullDesc: string | null; country: string | null; venueName: string | null; address: string | null; mapUrl: string | null;
  onlinePlatform: string | null; onlinePublicUrl: string | null; externalTicketUrl: string | null; ticketPrice: string | null;
  endsAt: string | null; registrationDeadlineAt: string | null; registrationMode: string; ticketType: string; capacity: number | null;
  registeredCount: number; waitlistEnabled: boolean; waitlistCount: number; participantListVis: string; tags: string[]; publicCancelReason: string | null;
  speakers: Record<string, unknown>[]; partners: Record<string, unknown>[]; schedule: Record<string, unknown>[];
}

export async function eventDetail(key: string): Promise<EventDetailData | null> {
  if (DATA_MODE !== 'supabase') {
    const e = EVENTS.find((x) => x.id === key); if (!e) return null;
    return { ...mockCard(e), fullDesc: e.desc ?? null, country: 'Україна', venueName: e.city, address: null, mapUrl: null,
      onlinePlatform: null, onlinePublicUrl: null, externalTicketUrl: null, ticketPrice: null, endsAt: null, registrationDeadlineAt: null,
      registrationMode: 'instant', ticketType: 'free', capacity: null, registeredCount: 0, waitlistEnabled: false, waitlistCount: 0,
      participantListVis: 'hidden', tags: [], publicCancelReason: null, speakers: [], partners: [], schedule: [] };
  }
  const d = await getEventBySlug(null, key, null);
  if (!d) return null;
  const r = d as Record<string, unknown>;
  return {
    ...mapCard(r), fullDesc: (r.full_desc as string) ?? null, country: (r.country as string) ?? null,
    venueName: (r.venue_name as string) ?? null, address: (r.address as string) ?? null, mapUrl: (r.map_url as string) ?? null,
    onlinePlatform: (r.online_platform as string) ?? null, onlinePublicUrl: (r.online_public_url as string) ?? null,
    externalTicketUrl: (r.external_ticket_url as string) ?? null,
    ticketPrice: r.ticket_price != null ? `${Number(r.ticket_price).toLocaleString('uk-UA')} ${r.currency ?? ''}`.trim() : null,
    endsAt: (r.ends_at as string) ?? null, registrationDeadlineAt: (r.registration_deadline_at as string) ?? null,
    registrationMode: (r.registration_mode as string) ?? 'instant', ticketType: (r.ticket_type as string) ?? 'free',
    capacity: r.capacity == null ? null : Number(r.capacity), registeredCount: Number(r.registered_count ?? 0),
    waitlistEnabled: !!r.waitlist_enabled, waitlistCount: Number(r.waitlist_count ?? 0), participantListVis: (r.participant_list_vis as string) ?? 'hidden',
    tags: (r.tags as string[]) ?? [], publicCancelReason: (r.public_cancel_reason as string) ?? null,
    speakers: (r.speakers as Record<string, unknown>[]) ?? [], partners: (r.partners as Record<string, unknown>[]) ?? [], schedule: (r.schedule as Record<string, unknown>[]) ?? [],
  };
}
