# Supabase — підключення (Етап 2)

Міграція з локальних сторів на Supabase. Наразі реалізовано **Auth** (email OTP
+ таблиця `profiles`) із graceful-fallback: поки ключі не задані, застосунок
працює на локальних сторах без змін.

## Кроки

1. **Створити проєкт** на [supabase.com](https://supabase.com) → скопіювати
   `Project URL` і `anon public` key (Project Settings → API).

2. **Схема БД**: у Dashboard → SQL Editor виконати `supabase/schema.sql`
   (таблиці, зв'язки, RLS-політики за ролями).

3. **Email OTP**: Auth → Providers → Email → увімкнути «Email OTP»
   (та за потреби налаштувати SMTP для продакшн-розсилки).

4. **Ключі у застосунок**: заповнити `src/supabaseConfig.ts`:

   ```ts
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

   Після цього `isSupabaseConfigured === true` і `AuthContext` автоматично
   перемикається з локального `AuthService` на `SupabaseAuthService`.

5. **Адміни** (для web-адмінки на Supabase у майбутньому): додати рядки в
   `public.admin_users` (`id` = `auth.users.id`, `role` = одна з admin_role).

6. Перевірити: `npx tsc --noEmit`, `npx expo start`, пройти реєстрацію —
   код прийде листом, профіль створиться в `public.profiles`.

## Що вже підключено

- `src/supabase.ts` — клієнт (створюється лише за наявності ключів; сесія в
  AsyncStorage; чистий JS → OTA-safe).
- `src/SupabaseAuthService.ts` — той самий інтерфейс, що й `AuthService`
  (requestCode/verifyCode/currentUser/patch/signOut/remove).
- `src/AuthContext.tsx` — обирає бекенд: Supabase (за наявності ключів) або
  локальний fallback.

## Наступні модулі (backlog міграції)

Після Auth — перевести на Supabase решту сторів тим самим патерном
(інтерфейс-сумісний сервіс + вибір бекенду): `contentContext` (articles,
categories), `networkStore` (intros, reports, org access), `opportunityStore`,
`eventStore`, `orgStore`, `notificationStore`, `bookmarks`. Схема для всіх
таблиць уже є в `schema.sql`.
