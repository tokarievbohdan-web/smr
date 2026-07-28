// Admin SPA — локальна конфігурація. Скопіюйте у config.local.js (НЕ комітиться)
// і підключіть у index.html ПЕРЕД основним скриптом:
//   <script src="config.local.js"></script>
//
// Адмінка НЕ містить service_role і НЕ виконує привілейовані запити напряму.
// Вона логіниться через Supabase Auth (anon key), отримує JWT і надсилає його
// Bearer-токеном у Next.js API (web), який перевіряє роль на сервері.
window.SMR_ADMIN_CONFIG = {
  // Публічні (anon/publishable) — безпечні у клієнті:
  SUPABASE_URL: 'https://esanyyhwabqwmvmisauy.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_xxx',
  // База довіреного Next.js API (привілейовані операції йдуть сюди):
  API_BASE: 'https://sportmarket.review',
};

// Тимчасовий демо-пароль shell-а (буде прибрано після повного переходу на
// Supabase Auth). Реальний захист даних — серверна перевірка ролі в API + RLS.
window.SMR_DEMO_PASSWORD = 'change-me-locally';
