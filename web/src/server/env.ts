import 'server-only';

// Серверна конфігурація. НІКОЛИ не імпортувати цей модуль у клієнтські компоненти
// ('server-only' кине помилку збірки, якщо потрапить у client bundle).

export const DATA_MODE = (process.env.DATA_MODE ?? 'mock') as 'mock' | 'supabase';
export const NODE_ENV = process.env.NODE_ENV ?? 'development';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// Лише сервер. Не має префікса NEXT_PUBLIC → не потрапляє у client bundle.
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Дозволений origin адмінки (для CORS адміністративних ендпоінтів).
export const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN ?? '';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Production guard: у режимі supabase відсутність ключів має падати контрольовано,
// а НЕ тихо відкочуватись на mock.
if (DATA_MODE === 'supabase' && !isSupabaseConfigured) {
  throw new Error(
    'DATA_MODE=supabase, але NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY не задані. ' +
    'Production не переходить на mock автоматично.',
  );
}
// Привілейовані серверні операції потребують service_role у режимі supabase.
export function assertServiceRole(): string {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY не задано (server-only). Потрібен для привілейованих операцій.');
  }
  return SERVICE_ROLE_KEY;
}
