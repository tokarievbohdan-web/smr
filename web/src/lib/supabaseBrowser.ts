'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Клієнтський Supabase (браузер) — ЛИШЕ anon key. Для єдиної авторизації
// (Email OTP) та публічних читань. Продуктовий UI підключається у Milestone 2.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = !!(url && anon);

let _client: SupabaseClient | null = null;
export function getSupabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase не налаштовано (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).');
  }
  if (!_client) _client = createClient(url, anon);
  return _client;
}
