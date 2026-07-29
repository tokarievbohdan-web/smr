#!/usr/bin/env node
/**
 * Застосовує міграції + seed на ЖИВИЙ Supabase через Management API
 * (POST /v1/projects/{ref}/database/query), потім ганяє RLS-тести.
 *
 * Токен береться з web/.env.local (SUPABASE_ACCESS_TOKEN=sbp_...) або з env.
 * НЕ комітити токен. Після застосування — відкликати токен у Dashboard.
 *
 *   node scripts/apply-remote.mjs            # міграції + seed + тести
 *   node scripts/apply-remote.mjs --no-tests # без rls_tests
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = 'esanyyhwabqwmvmisauy';
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;

function readEnvLocal(key) {
  if (process.env[key]) return process.env[key];
  const f = join(ROOT, 'web', '.env.local');
  if (!existsSync(f)) return null;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = new RegExp(`^\\s*${key}\\s*=\\s*(.+)\\s*$`).exec(line);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const TOKEN = readEnvLocal('SUPABASE_ACCESS_TOKEN');
if (!TOKEN) {
  console.error('❌ Немає SUPABASE_ACCESS_TOKEN. Створи Personal Access Token у Supabase');
  console.error('   (Account → Access Tokens) і додай рядок у web/.env.local:');
  console.error('   SUPABASE_ACCESS_TOKEN=sbp_xxx');
  process.exit(1);
}

async function runSql(query, label) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const msg = (json && json.message) || text;
    throw new Error(`${label}: HTTP ${res.status} — ${String(msg).split('\n')[0]}`);
  }
  return json;
}

const migDir = join(ROOT, 'supabase', 'migrations');
const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();

console.log(`→ Застосування ${files.length} міграцій на проєкт ${REF}\n`);
for (const f of files) {
  try { await runSql(readFileSync(join(migDir, f), 'utf8'), f); console.log('  OK  ', f); }
  catch (e) { console.error('  ERR ', e.message); process.exit(1); }
}

try {
  await runSql(readFileSync(join(ROOT, 'supabase', 'seed.sql'), 'utf8'), 'seed.sql');
  const tax = await runSql('select count(*)::int as n from public.taxonomies', 'count');
  console.log('  OK   seed.sql  (taxonomies =', (tax[0] && tax[0].n), ')');
} catch (e) { console.error('  ERR ', e.message); process.exit(1); }

if (!process.argv.includes('--no-tests')) {
  console.log('\n→ RLS/authz тести на живій БД (rls_tests.sql)');
  try {
    await runSql(readFileSync(join(ROOT, 'supabase', 'tests', 'rls_tests.sql'), 'utf8'), 'rls_tests');
    console.log('  ✅ rls_tests.sql — без винятків: усі негативні + позитивні пройдено');
  } catch (e) {
    console.error('  ❌', e.message);
    process.exit(1);
  }
}

console.log('\n✅ Готово: схема застосована й перевірена на живому Supabase.');
console.log('   Не забудь ВІДКЛИКАТИ Personal Access Token у Dashboard.');
