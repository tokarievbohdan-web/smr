import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anonClient, userClient } from '../database/clients';

export function readClient(jwt: string | null): SupabaseClient {
  return jwt ? userClient(jwt) : anonClient();
}

// ---------- People directory ----------
const PROFILE_SUMMARY = 'id,display_name,avatar,headline,current_position,city,region,country,verified,sports,professional_categories,availability_statuses';

export interface DirectoryParams {
  limit?: number; offset?: number; search?: string | null; verified?: boolean;
  sport?: string | null; category?: string | null; skill?: string | null;
  city?: string | null; region?: string | null; country?: string | null;
  type?: string | null; availability?: string | null;
}

export async function getProfileDirectory(jwt: string | null, p: DirectoryParams) {
  const db = readClient(jwt);
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 50);
  const offset = Math.max(p.offset ?? 0, 0);
  let q = db.from('public_profiles').select(PROFILE_SUMMARY, { count: 'estimated' });
  if (p.verified) q = q.eq('verified', true);
  if (p.city) q = q.eq('city', p.city);
  if (p.region) q = q.eq('region', p.region);
  if (p.country) q = q.eq('country', p.country);
  if (p.sport) q = q.contains('sports', [p.sport]);
  if (p.category) q = q.contains('professional_categories', [p.category]);
  if (p.skill) q = q.contains('skills', [p.skill]);
  if (p.availability) q = q.contains('availability_statuses', [p.availability]);
  if (p.search) q = q.or(`display_name.ilike.%${p.search}%,headline.ilike.%${p.search}%,current_position.ilike.%${p.search}%`);
  q = q.order('verified', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, limit, offset };
}

export async function getProfileById(jwt: string | null, id: string) {
  const db = readClient(jwt);
  const { data, error } = await db.from('public_profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [exp, proj, port] = await Promise.all([
    db.from('profile_experience').select('title,organization_name,start_date,end_date,is_current,description,sort_order').eq('profile_id', id).eq('is_public', true).order('sort_order'),
    db.from('profile_projects').select('title,role,organization_name,url,description,sort_order').eq('profile_id', id).eq('is_public', true).order('sort_order'),
    db.from('profile_portfolio_items').select('title,url,description,sort_order').eq('profile_id', id).eq('is_public', true).order('sort_order'),
  ]);
  return { ...data, experience: exp.data ?? [], projects: proj.data ?? [], portfolio: port.data ?? [] };
}

// ---------- Organizations directory ----------
const ORG_SUMMARY = 'id,name,slug,type_code,type_title,city,region,country,short_desc,logo,verified,sports';

export async function getOrgDirectory(jwt: string | null, p: DirectoryParams) {
  const db = readClient(jwt);
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 50);
  const offset = Math.max(p.offset ?? 0, 0);
  let q = db.from('public_organizations').select(ORG_SUMMARY, { count: 'estimated' });
  if (p.verified) q = q.eq('verified', true);
  if (p.type) q = q.eq('type_code', p.type);
  if (p.city) q = q.eq('city', p.city);
  if (p.region) q = q.eq('region', p.region);
  if (p.country) q = q.eq('country', p.country);
  if (p.sport) q = q.contains('sports', [p.sport]);
  if (p.category) q = q.contains('professional_categories', [p.category]);
  if (p.search) q = q.or(`name.ilike.%${p.search}%,short_desc.ilike.%${p.search}%`);
  q = q.order('verified', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, limit, offset };
}

export async function getOrgBySlug(jwt: string | null, slugRaw: string) {
  const db = readClient(jwt);
  let slug = slugRaw; try { slug = decodeURIComponent(slugRaw); } catch { /* keep */ }
  const { data, error } = await db.from('public_organizations').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: hist } = await db.from('organization_slug_history').select('organization_id').eq('old_slug', slug).maybeSingle();
    if (!hist) return null;
    const r = await db.from('public_organizations').select('*').eq('id', hist.organization_id).maybeSingle();
    if (!r.data) return null;
    return withTeam(db, r.data as Record<string, unknown>);
  }
  return withTeam(db, data);
}

async function withTeam(db: SupabaseClient, org: Record<string, unknown>) {
  const { data: members } = await db.from('organization_members')
    .select('user_id,role,job_title,profile:public_profiles(id,display_name,avatar,headline)')
    .eq('org_id', org.id as string).eq('status', 'active').eq('is_public', true).order('role');
  return { ...org, team: members ?? [] };
}

// ---------- Own profile (authenticated) ----------
export async function getOwnProfile(jwt: string, userId: string) {
  const { data, error } = await userClient(jwt).from('profiles')
    .select('id,email,first_name,last_name,display_name,avatar,avatar_media_id,headline,current_position,current_organization_id,city,region,country,bio,languages,sports,professional_categories,skills,availability_statuses,public_email,public_phone,website,linkedin_url,other_social_links,contact_visibility,profile_visibility,onboarding_completed,verification_status,verification_note,verification_submitted_at,moderation_status,version')
    .eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
