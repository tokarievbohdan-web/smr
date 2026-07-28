// ── Конфігурація Supabase (через environment variables) ─────────
// Значення НЕ зберігаються у коді. Задаються через .env (див. .env.example):
//   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_DATA_MODE
//
// DATA_MODE:
//   'mock'     — локальні стори (лише для розробки);
//   'supabase' — production: обовʼязково мають бути задані URL + anon key.
//
// anon key — публічний ключ (безпечно у client). service_role key у мобільний/веб
// клієнт НЕ додається — лише на захищеному сервері.

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const DATA_MODE = (process.env.EXPO_PUBLIC_DATA_MODE ?? "mock") as "mock" | "supabase";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
