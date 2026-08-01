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
// APP_ENV задаємо ЯВНО (не похідне від NODE_ENV): Next виставляє NODE_ENV=production
// під час build, тож похідне значення хибно вмикало б валідацію на етапі збірки.
export const APP_ENV = (process.env.APP_ENV ?? 'development') as 'local' | 'development' | 'staging' | 'production';

// Startup validation: у production несумісна конфігурація має падати з ЯСНОЮ помилкою,
// а не тихо працювати на dev-значеннях. Не спрацьовує на етапі build.
export function validateProductionEnv(): void {
  if (APP_ENV !== 'production') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const problems: string[] = [];
  if (DATA_MODE !== 'supabase') problems.push('DATA_MODE має бути "supabase" у production (mock заборонено).');
  if (!isSupabaseConfigured) problems.push('Відсутні NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.');
  if (/localhost|127\.0\.0\.1/.test(SUPABASE_URL)) problems.push('SUPABASE_URL вказує на localhost у production.');
  if (!process.env.CRON_SECRET) problems.push('CRON_SECRET не задано (потрібен для cron-ендпоінтів).');
  if (!ADMIN_ORIGIN) problems.push('ADMIN_ORIGIN не задано (CORS адмінки).');
  if (problems.length) throw new Error('Production env невалідний:\n - ' + problems.join('\n - '));
}
validateProductionEnv();

// Привілейовані серверні операції потребують service_role у режимі supabase.
export function assertServiceRole(): string {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY не задано (server-only). Потрібен для привілейованих операцій.');
  }
  return SERVICE_ROLE_KEY;
}
