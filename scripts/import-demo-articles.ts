/**
 * Staging import demo-статей: mock (web/src/lib/data.ts) → Supabase через реальні
 * редакційні RPC (create→update→publish). Ідемпотентно (пропускає наявний slug).
 * НЕ запускати автоматично в production.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=you@smr \
 *     npx tsx scripts/import-demo-articles.ts
 *
 * ADMIN_EMAIL має бути super_admin/editor (для RPC потрібна сесія цього юзера).
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { ARTICLES } from '../web/src/lib/data';

const URL = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!URL || !SR || !EMAIL) { console.error('need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL'); process.exit(1); }

const TYPE_MAP: Record<string, string> = {
  'Новина': 'news', 'Кейс': 'case_study', 'Інтервʼю': 'interview', 'Дослідження': 'research',
  'Інсайт': 'insight', 'Колонка': 'opinion', 'Думка': 'opinion', 'Гайд': 'guide', 'Рейтинг': 'ranking',
};
const CAT_MAP: Record<string, string> = {
  'Маркетинг': 'marketing', 'Комерція': 'commercial', 'Медіа': 'media', 'Кейси': 'case-studies',
  'iGaming': 'igaming', 'Технології': 'technology', 'Інфраструктура': 'infrastructure',
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/g, '-').replace(/^-|-$/g, '');

const svc = createClient(URL, SR, { auth: { persistSession: false } });

async function editorSession() {
  const gl = await svc.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });
  if (gl.error) throw gl.error;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const cli = createClient(URL, anonKey!, { auth: { persistSession: false } });
  const v = await cli.auth.verifyOtp({ token_hash: gl.data.properties!.hashed_token!, type: 'magiclink' });
  if (v.error) throw v.error;
  return createClient(URL, anonKey!, { global: { headers: { Authorization: `Bearer ${v.data.session!.access_token}` } }, auth: { persistSession: false } });
}

async function ensureAuthor(name: string): Promise<string> {
  const slug = slugify(name);
  const { data } = await svc.from('authors').select('id').eq('slug', slug).maybeSingle();
  if (data) return data.id;
  const ins = await svc.from('authors').insert({ name, slug, active: true }).select('id').single();
  if (ins.error) throw ins.error;
  return ins.data.id;
}

async function catId(uaLabel: string): Promise<string | null> {
  const slug = CAT_MAP[uaLabel] || 'insights';
  const { data } = await svc.from('article_categories').select('id').eq('slug', slug).maybeSingle();
  return data?.id ?? null;
}

(async () => {
  const ed = await editorSession();
  const mapping: Record<string, { id: string; slug: string }> = {};
  let created = 0, skipped = 0;

  for (const a of ARTICLES) {
    const slug = slugify(a.title).slice(0, 80);
    const exists = await svc.from('articles').select('id').eq('slug', slug).maybeSingle();
    if (exists.data) { skipped++; mapping[a.id] = { id: exists.data.id, slug }; console.log('skip (exists):', a.title); continue; }

    const author_id = await ensureAuthor(a.author);
    const category_id = await catId(a.category);
    const paras: string[] = a.body ?? [a.subtitle];
    const body = { version: 1, blocks: paras.map((p, i) => ({ id: `b${i + 1}`, type: 'paragraph', text: p })) };

    const c = await ed.rpc('create_article_draft', { p_patch: { title: a.title, slug } });
    if (c.error) { console.error('create fail', a.title, c.error.message); continue; }
    const id = (c.data as any).id;
    await ed.rpc('update_article_draft', { p_id: id, p_patch: {
      subtitle: a.subtitle, excerpt: a.subtitle, type: TYPE_MAP[a.type] || 'news',
      category_id, author_id, reading_time_minutes: a.readMin, body,
    }, p_expected_version: 1 });
    const p = await ed.rpc('publish_article', { p_id: id });
    if (p.error) { console.error('publish fail', a.title, p.error.message); continue; }
    // (featured керується лише адміном через захищене поле — тут не виставляємо)
    mapping[a.id] = { id, slug: (p.data as any).slug };
    created++; console.log('published:', (p.data as any).slug);
  }

  writeFileSync('scripts/import-artifact.json', JSON.stringify({ when: new Date().toISOString(), mapping }, null, 2));
  console.log(`\n✅ import done: ${created} created, ${skipped} skipped. mapping → scripts/import-artifact.json`);
})().catch((e) => { console.error(e); process.exit(1); });
