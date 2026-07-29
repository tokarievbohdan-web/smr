/**
 * Staging import demo Network: mock PEOPLE/ORGS → Supabase.
 * Профілі: auth-користувач (staging email) + контент (service) + верифікація (admin RPC).
 * Організації: super-сесія create_draft → update → approve → verify (owner = super).
 * Ідемпотентно за email/назвою. НЕ для production.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   ADMIN_EMAIL=super@... npx tsx scripts/import-demo-network.ts
 */
import { createClient } from '@supabase/supabase-js';
import { PEOPLE, ORGS } from '../web/src/lib/data';

const URL = process.env.SUPABASE_URL!, SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
if (!URL || !SR || !ANON || !ADMIN_EMAIL) { console.error('need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL'); process.exit(1); }
const svc = createClient(URL, SR, { auth: { persistSession: false } });

const AVAIL: Record<string, string> = { 'шукаю партнерів': 'looking_for_partners', 'спікер': 'available_as_speaker', 'готовий бути спікером': 'available_as_speaker', 'відкритий до проєктів': 'open_to_projects', 'відкритий до роботи': 'open_to_work', 'відкрита до роботи': 'open_to_work' };
const ORGTYPE: Record<string, string> = { 'клуб': 'club', 'федерація': 'federation', 'медіа': 'media', 'бренд': 'brand', 'агентство': 'agency', 'ліга': 'league' };
const translit = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/g, '-').replace(/^-|-$/g, '');

async function sessionFor(email: string) {
  let u = (await svc.auth.admin.listUsers({ page: 1, perPage: 200 })).data.users.find((x) => x.email === email);
  if (!u) u = (await svc.auth.admin.createUser({ email, email_confirm: true })).data.user!;
  const gl = await svc.auth.admin.generateLink({ type: 'magiclink', email });
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const v = await anon.auth.verifyOtp({ token_hash: gl.data.properties!.hashed_token!, type: 'magiclink' });
  return { id: u.id, client: createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${v.data.session!.access_token}` } }, auth: { persistSession: false } }) };
}

(async () => {
  const admin = await sessionFor(ADMIN_EMAIL); // super_admin
  let people = 0, orgs = 0;

  for (const p of PEOPLE) {
    const email = `demo-${p.id}@staging.smr`;
    const [firstName, ...rest] = p.name.split(' ');
    let u = (await svc.auth.admin.listUsers({ page: 1, perPage: 200 })).data.users.find((x) => x.email === email);
    if (!u) u = (await svc.auth.admin.createUser({ email, email_confirm: true })).data.user!;
    const avail = [...new Set(p.availability.map((a) => AVAIL[a.trim().toLowerCase()]).filter(Boolean))];
    await svc.from('profiles').update({
      first_name: firstName, last_name: rest.join(' '), display_name: p.name, headline: p.role,
      city: /Київ/.test(p.role) ? 'Київ' : /Львів/.test(p.role) ? 'Львів' : null,
      professional_categories: p.competencies, skills: p.competencies,
      availability_statuses: avail, profile_visibility: 'public', onboarding_completed: true,
    }).eq('id', u.id);
    if (p.verified) await admin.client.rpc('admin_set_profile_verification', { p_id: u.id, p_status: 'verified' });
    people++; console.log('profile:', p.name);
  }

  for (const o of ORGS) {
    const slug = translit(o.name).slice(0, 60);
    const exists = (await svc.from('organizations').select('id').eq('slug', slug).maybeSingle()).data;
    if (exists) { console.log('org exists:', o.name); continue; }
    const c = await admin.client.rpc('create_organization_draft', { p_patch: { name: o.name, city: o.city, short_desc: `${o.type} · ${o.sports.join(', ')}` } });
    if (c.error) { console.error('org create fail', o.name, c.error.message); continue; }
    const id = (c.data as { id: string }).id;
    const typeCode = ORGTYPE[o.type.toLowerCase()] || 'other';
    const t = (await svc.from('organization_types').select('id').eq('code', typeCode).maybeSingle()).data;
    await admin.client.rpc('update_organization', { p_id: id, p_patch: { organization_type_id: t?.id, sports: o.sports } });
    await admin.client.rpc('admin_set_org_moderation', { p_id: id, p_status: 'approved' });
    if (o.verified) await admin.client.rpc('admin_set_org_verification', { p_id: id, p_status: 'verified' });
    orgs++; console.log('org:', o.name);
  }

  console.log(`\n✅ network import: ${people} profiles, ${orgs} organizations`);
})().catch((e) => { console.error(e); process.exit(1); });
