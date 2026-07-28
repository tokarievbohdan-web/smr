// ── Конфігурація Supabase ──────────────────────────────
// Заповніть значеннями свого проєкту: Supabase Dashboard → Project Settings → API.
// Поки поля порожні, застосунок працює на локальних сторах (graceful fallback).
//
//   export const SUPABASE_URL = 'https://xxxx.supabase.co';
//   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
//
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
