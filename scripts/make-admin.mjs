#!/usr/bin/env node
// Створює/знаходить auth-користувача та призначає йому admin-роль.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_ROLE(=super_admin)
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ROLE = process.env.ADMIN_ROLE || 'super_admin';
if (!URL || !KEY || !EMAIL) { console.error('need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL'); process.exit(1); }

const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function findByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page++;
  }
}

let user = await findByEmail(EMAIL);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log('＋ auth user created:', EMAIL);
} else {
  console.log('≈ auth user exists:', EMAIL);
}

const { error: aErr } = await admin.from('admin_users')
  .upsert({ id: user.id, email: EMAIL, role: ROLE, status: 'active' }, { onConflict: 'id' });
if (aErr) { console.error('admin_users upsert error:', aErr.message); process.exit(1); }

const { data: check } = await admin.from('admin_users').select('email,role,status').eq('id', user.id).single();
console.log('✅ admin_users:', check);
console.log('   user id:', user.id);
