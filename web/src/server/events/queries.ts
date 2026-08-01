import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anonClient, userClient } from '../database/clients';

export function readClient(jwt: string | null): SupabaseClient {
  return jwt ? userClient(jwt) : anonClient();
}

const SUMMARY =
  'id,slug,title,short_desc,cover,type_slug,type_title,format_kind,org_id,org_name,org_slug,org_logo,org_verified,' +
  'country,region,city,venue_name,timezone,starts_at,ends_at,registration_deadline_at,capacity,registered_count,waitlist_count,waitlist_enabled,' +
  'ticket_type,ticket_price,currency,external_ticket_url,registration_mode,business_status,featured,tags,published_at,postponed_at,public_cancel_reason';
const DETAIL = SUMMARY + ',cover_media_id,online_platform,online_public_url,registration_opens_at,participant_list_vis,created_at,updated_at';

export interface EventFeedParams {
  limit?: number; offset?: number; search?: string | null; type?: string | null; format?: string | null;
  city?: string | null; region?: string | null; country?: string | null; tag?: string | null;
  online?: boolean; free?: boolean; paid?: boolean; verified?: boolean; spots?: boolean;
  timeframe?: string | null; scope?: string | null; sort?: string | null;
}

// Публічна стрічка подій (server-side pagination + filters). Тільки public_events.
export async function getEventFeed(jwt: string | null, p: EventFeedParams) {
  const db = readClient(jwt);
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 50);
  const offset = Math.max(p.offset ?? 0, 0);
  const past = p.scope === 'past';
  let q = db.from('public_events').select(SUMMARY, { count: 'estimated' });
  if (p.type) q = q.eq('type_slug', p.type);
  if (p.format) q = q.eq('format_kind', p.format);
  if (p.online) q = q.in('format_kind', ['online', 'hybrid']);
  if (p.city) q = q.eq('city', p.city);
  if (p.region) q = q.eq('region', p.region);
  if (p.country) q = q.eq('country', p.country);
  if (p.tag) q = q.contains('tags', [p.tag]);
  if (p.free) q = q.eq('ticket_type', 'free');
  if (p.paid) q = q.eq('ticket_type', 'paid_external');
  if (p.verified) q = q.eq('org_verified', true);
  if (p.search) q = q.or(`title.ilike.%${p.search}%,short_desc.ilike.%${p.search}%,city.ilike.%${p.search}%`);
  // upcoming vs past за starts_at
  const nowIso = new Date().toISOString();
  if (past) q = q.lt('starts_at', nowIso).order('starts_at', { ascending: false });
  else {
    q = q.gte('starts_at', p.timeframe ? nowIso : '1970-01-01').neq('business_status', 'completed');
    if (p.timeframe === 'week' || p.timeframe === 'month' || p.timeframe === 'today') {
      const end = new Date(); end.setDate(end.getDate() + (p.timeframe === 'today' ? 1 : p.timeframe === 'week' ? 7 : 31));
      q = q.lte('starts_at', end.toISOString());
    }
    if (p.sort === 'deadline') q = q.order('registration_deadline_at', { ascending: true, nullsFirst: false });
    else if (p.sort === 'newest') q = q.order('published_at', { ascending: false });
    else q = q.order('featured', { ascending: false }).order('starts_at', { ascending: true });
  }
  q = q.range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, limit, offset };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function getEventBySlug(jwt: string | null, keyRaw: string, userId: string | null) {
  const db = readClient(jwt);
  let key = keyRaw; try { key = decodeURIComponent(keyRaw); } catch { /* keep */ }
  const { data, error } = await db.from('public_events').select(DETAIL).eq(UUID_RE.test(key) ? 'id' : 'slug', key).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  const id = row.id as string;
  const [sp, pt, sc] = await Promise.all([
    db.from('event_speakers').select('id,name,headline,organization_name,bio,profile_id,sort_order').eq('event_id', id).eq('is_public', true).order('sort_order'),
    db.from('event_partners').select('id,name,partner_type,external_url,organization_id,sort_order').eq('event_id', id).order('sort_order'),
    db.from('event_schedule_items').select('id,title,description,starts_at,ends_at,location_label,sort_order').eq('event_id', id).is('deleted_at', null).order('sort_order'),
  ]);
  let myRegistration: Record<string, unknown> | null = null;
  if (userId && jwt) {
    const { data: r } = await userClient(jwt).from('event_registrations')
      .select('id,status,promotion_status,promotion_expires_at,consent_to_participant_list').eq('event_id', id).eq('user_id', userId).maybeSingle();
    myRegistration = (r as Record<string, unknown> | null) ?? null;
  }
  return { ...row, speakers: sp.data ?? [], partners: pt.data ?? [], schedule: sc.data ?? [], myRegistration };
}

// ---------- my events (registered) ----------
export async function getMyEvents(jwt: string, userId: string) {
  const db = userClient(jwt);
  const { data, error } = await db.from('event_registrations')
    .select('id,status,promotion_status,promotion_expires_at,registered_at,event:events(id,slug,title,starts_at,ends_at,timezone,city,format_kind,business_status,cover)')
    .eq('user_id', userId).is('deleted_at', null).in('status', ['pending', 'registered', 'waitlisted', 'attended', 'invited'])
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------- organizer workspace ----------
export async function getOrgEvents(jwt: string, orgId: string) {
  const { data, error } = await userClient(jwt).from('events')
    .select('id,slug,title,type:event_types(title_uk),format_kind,business_status,moderation,starts_at,capacity,registered_count,waitlist_count,updated_at')
    .eq('org_id', orgId).is('deleted_at', null).order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getEventManage(jwt: string, id: string) {
  const { data, error } = await userClient(jwt).from('events')
    .select('*,type:event_types(id,slug,title_uk),organization:organizations(id,name,slug)').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getEventRegistrations(jwt: string, eventId: string) {
  const { data, error } = await userClient(jwt).from('event_registrations')
    .select('id,user_id,status,promotion_status,answers,consent_to_participant_list,registered_at,approved_at,checked_in_at,profile:profiles!event_registrations_user_id_fkey(display_name,headline,city,verification_status)')
    .eq('event_id', eventId).is('deleted_at', null).order('registered_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------- admin (Event Manager) ----------
export async function getAdminEvents(jwt: string, params: { moderation?: string | null; business?: string | null; format?: string | null; q?: string | null }) {
  const db = userClient(jwt);
  let q = db.from('events')
    .select('id,slug,title,type:event_types(title_uk),format_kind,city,starts_at,capacity,registered_count,waitlist_count,ticket_type,registration_mode,moderation,business_status,created_by,org:organizations(name,slug),updated_at')
    .is('deleted_at', null);
  if (params.moderation) q = q.eq('moderation', params.moderation);
  if (params.business) q = q.eq('business_status', params.business);
  if (params.format) q = q.eq('format_kind', params.format);
  if (params.q) q = q.ilike('title', `%${params.q}%`);
  q = q.order('updated_at', { ascending: false }).limit(200);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function getAdminEvent(jwt: string, id: string) {
  const db = userClient(jwt);
  const { data, error } = await db.from('events')
    .select('*,type:event_types(id,slug,title_uk),organization:organizations(id,name,slug,verification)').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [notes, resched, regs] = await Promise.all([
    db.from('event_internal_notes').select('id,body,author_user_id,created_at').eq('event_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
    db.from('event_reschedule_history').select('old_starts_at,new_starts_at,reason,created_at').eq('event_id', id).order('created_at', { ascending: false }),
    db.from('event_registrations').select('status', { count: 'exact', head: true }).eq('event_id', id),
  ]);
  return { ...(data as Record<string, unknown>), internalNotes: notes.data ?? [], rescheduleHistory: resched.data ?? [], registrationsCount: regs.count ?? 0 };
}
