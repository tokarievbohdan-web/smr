import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anonClient, userClient } from '../database/clients';

export function readClient(jwt: string | null): SupabaseClient {
  return jwt ? userClient(jwt) : anonClient();
}

const SUMMARY =
  'id,slug,title,short_desc,type_slug,type_title,org_id,org_name,org_slug,org_logo,org_verified,' +
  'sports,city,region,country,remote_mode,budget_vis,budget_from,budget_to,currency,' +
  'application_deadline,expiration_date,featured,applications_count,published_at';
const DETAIL = SUMMARY + ',full_desc,professional_categories,tags,expected_format,application_method,external_application_url,views_count,created_at';

export interface OppFeedParams {
  limit?: number; offset?: number; search?: string | null; type?: string | null;
  sport?: string | null; category?: string | null; city?: string | null; region?: string | null;
  country?: string | null; remote?: string | null; verified?: boolean; sort?: string | null;
}

export async function getOpportunityFeed(jwt: string | null, p: OppFeedParams) {
  const db = readClient(jwt);
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 50);
  const offset = Math.max(p.offset ?? 0, 0);
  let q = db.from('public_opportunities').select(SUMMARY, { count: 'estimated' });
  if (p.type) q = q.eq('type_slug', p.type);
  if (p.verified) q = q.eq('org_verified', true);
  if (p.city) q = q.eq('city', p.city);
  if (p.region) q = q.eq('region', p.region);
  if (p.country) q = q.eq('country', p.country);
  if (p.remote) q = q.eq('remote_mode', p.remote);
  if (p.sport) q = q.contains('sports', [p.sport]);
  if (p.category) q = q.contains('professional_categories', [p.category]);
  if (p.search) q = q.or(`title.ilike.%${p.search}%,short_desc.ilike.%${p.search}%`);
  if (p.sort === 'deadline') q = q.order('application_deadline', { ascending: true, nullsFirst: false });
  else q = q.order('featured', { ascending: false }).order('published_at', { ascending: false });
  q = q.range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, limit, offset };
}

export async function getOpportunityBySlug(jwt: string | null, slugRaw: string, userId: string | null) {
  const db = readClient(jwt);
  let slug = slugRaw; try { slug = decodeURIComponent(slugRaw); } catch { /* keep */ }
  const { data, error } = await db.from('public_opportunities').select(DETAIL).eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  let myApplication: { status: string } | null = null;
  if (userId && jwt) {
    const { data: app } = await userClient(jwt).from('applications').select('status').eq('opp_id', row.id as string).eq('user_id', userId).maybeSingle();
    myApplication = (app as { status: string } | null) ?? null;
  }
  return { ...row, myApplication };
}

// ---------- org opportunities (management) ----------
export async function getOrgOpportunities(jwt: string, orgId: string) {
  const { data, error } = await userClient(jwt).from('opportunities')
    .select('id,slug,title,type:opportunity_types(title_uk),business_status,moderation,application_deadline,expiration_date,applications_count,views_count,updated_at')
    .eq('org_id', orgId).is('deleted_at', null).order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getOpportunityManage(jwt: string, id: string) {
  const { data, error } = await userClient(jwt).from('opportunities')
    .select('*,type:opportunity_types(id,slug,title_uk),organization:organizations(id,name,slug)').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- applications ----------
export async function getMyApplications(jwt: string, userId: string) {
  const { data, error } = await userClient(jwt).from('applications')
    .select('id,status,cover_message,submitted_at,opp:opportunities(id,slug,title,business_status,org:organizations(name))')
    .eq('user_id', userId).is('deleted_at', null).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getOppApplications(jwt: string, oppId: string) {
  const { data, error } = await userClient(jwt).from('applications')
    .select('id,user_id,status,cover_message,portfolio_url,applicant_snapshot,submitted_at,viewed_at')
    .eq('opp_id', oppId).is('deleted_at', null).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getApplication(jwt: string, id: string) {
  const db = userClient(jwt);
  const { data, error } = await db.from('applications')
    .select('id,opp_id,user_id,status,cover_message,portfolio_url,attachment_media_id,applicant_snapshot,submitted_at,opp:opportunities(slug,title,org_id)').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: history } = await db.from('application_status_history').select('from_status,to_status,change_reason,created_at').eq('application_id', id).order('created_at');
  return { ...data, history: history ?? [] };
}
