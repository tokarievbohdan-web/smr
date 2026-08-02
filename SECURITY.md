# SECURITY

## Модель довіри
Клієнт (mobile/web/admin) → Next.js server API → Postgres RPC/RLS → Supabase.
Клієнт **ніколи** не має service_role. Роль адміна визначається сервером із таблиці
`admin_users` (не з JWT/app_metadata), suspended/deleted → без прав.

## Ключові гарантії (перевірені автотестами)
- RLS на всіх таблицях; публічно видно лише approved/published сутності.
- Trigger-барʼєр: системні поля (moderation/business status, published_at, verified,
  капасіті-лічильники, приватні лінки) змінюються лише через SECURITY DEFINER RPC
  (`app.privileged_write` flag) — прямий client-update не проходить.
- Owner не self-verify/self-publish (профіль, організація, можливість, подія).
- Introductions: контакти розкриваються лише після згоди; internal notes — лише PM/admin.
- Events: капасіті під row-lock → overbooking неможливий; приватний online-лінк лише
  учаснику; participant list — за consent.
- Beta-коди зберігаються лише хешованими (sha256); raw код не логується.
- Push-токен інвалідовується у попереднього власника при реєстрації в іншого користувача.
- Security-сповіщення не можна вимкнути; security-згоду не можна відкликати.

## Rate limiting
Foundation: `web/src/server/admin/rateLimit.ts` (token bucket per process), застосовується
у `adminRoute`/`authedRoute` за user/admin ID → 429. Для multi-instance замінити на Redis
(інтерфейс `checkRateLimit` незмінний). Категорії (auth/search/actions/admin) — конфігуровні.

## Regression suite
Єдиний прогін: `node supabase/tests/regression.mjs` (PGlite, застосовує всі міграції з нуля
+ негативні/позитивні RLS + бізнес-інваріанти). Плюс живий `scripts/apply-remote.mjs`
(rls_tests.sql на реальній БД).

## Відкриті ризики (beta-accepted)
- email-провайдер / SPF-DKIM-DMARC — foundation, підключити перед розсилками;
- error-tracking (Sentry) — план, точка інтеграції готова;
- admin MFA — план (блокер, див. нижче);
- antivirus для довільних вкладень — не підключено (quarantine foundation).

## Admin MFA (blocker + план)
Supabase Auth підтримує MFA (TOTP). План: увімкнути enrollment для `admin_users` ролей
(super_admin/moderator/partnership_manager/event_manager), вимагати AAL2 у
`requireAdminRole`. Потребує UI enrollment у адмінці — винесено в окремий крок.
