import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, assertServiceRole } from '../env';

// Три види клієнтів. Жоден не персистить сесію (серверний контекст).

/** Анонімний клієнт — публічні читання через RLS/public views. */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Клієнт від імені користувача (передаємо його JWT). auth.uid() = цей користувач,
 * тож RLS та SECURITY DEFINER RPC бачать реального викликача. Використовується
 * для admin-RPC: роль перевіряється в БД, ми НЕ довіряємо клієнтській заяві.
 */
export function userClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

/**
 * Service-role клієнт — оминає RLS. Лише для операцій, що цього справді
 * потребують (напр. перевірка admin_users без рекурсії). service_role key
 * ніколи не йде в клієнт. Кидає, якщо ключа немає.
 */
export function serviceClient(): SupabaseClient {
  const key = assertServiceRole();
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
