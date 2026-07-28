#!/usr/bin/env node
/**
 * Dev/staging seed КОРИСТУВАЧІВ та АДМІНІВ через Supabase Admin API.
 * Паролі беруться з ENV, НЕ з коду. Запускати лише на dev/staging.
 *
 * Потрібні env:
 *   SUPABASE_URL                 (напр. https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY    (server-only; НЕ комітити)
 *   SEED_PASSWORD                (спільний пароль тестових акаунтів)
 *
 * Запуск:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_PASSWORD=... \
 *     node scripts/seed-users.mjs
 *
 * Ідемпотентно: якщо email існує — оновлює профіль/роль, не дублює.
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASS = process.env.SEED_PASSWORD;

if (!URL || !KEY || !PASS) {
  console.error('❌ Потрібні SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD у env.');
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

/** @type {{email:string, role?:string, status?:string, adminRole?:string, adminStatus?:string, profile?:object}[]} */
const USERS = [
  { email: 'user@staging.smr',    profile: { firstName: 'Тест', lastName: 'Користувач', city: 'Київ', headline: 'Спеціаліст з маркетингу' } },
  { email: 'blocked@staging.smr', status: 'blocked', profile: { firstName: 'Заблок', lastName: 'Ований' } },
  { email: 'pending@staging.smr', status: 'pending', profile: { firstName: 'На', lastName: 'Модерації' } },
  { email: 'super@staging.smr',    adminRole: 'super_admin' },
  { email: 'editor@staging.smr',   adminRole: 'editor' },
  { email: 'moderator@staging.smr',adminRole: 'moderator' },
  { email: 'partner@staging.smr',  adminRole: 'partnership_manager' },
  { email: 'events@staging.smr',   adminRole: 'event_manager' },
  { email: 'analyst@staging.smr',  adminRole: 'analyst' },
];

async function findUserByEmail(email) {
  // немає прямого getByEmail — гортаємо сторінки (для seed цього достатньо)
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function upsertUser(u) {
  let user = await findUserByEmail(u.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email, password: PASS, email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`＋ created ${u.email}`);
  } else {
    console.log(`≈ exists  ${u.email}`);
  }

  // handle_new_user міг створити профіль; оновлюємо поля
  const patch = { email: u.email };
  if (u.status) patch.status = u.status;
  if (u.profile) patch.profile = u.profile;
  const { error: pErr } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (pErr) console.warn(`  profile update warn (${u.email}): ${pErr.message}`);

  if (u.adminRole) {
    const { error: aErr } = await admin.from('admin_users').upsert({
      id: user.id, email: u.email, role: u.adminRole, status: u.adminStatus || 'active',
    });
    if (aErr) console.warn(`  admin upsert warn (${u.email}): ${aErr.message}`);
    else console.log(`  ↳ admin role: ${u.adminRole}`);
  }
}

for (const u of USERS) {
  try { await upsertUser(u); }
  catch (e) { console.error(`❌ ${u.email}: ${e.message}`); }
}
console.log('✅ seed-users done');
