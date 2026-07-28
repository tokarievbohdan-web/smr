# Supabase — база даних, міграції, runbook (Milestone 1)

Джерело правди схеми — **послідовні міграції** у `supabase/migrations/`
(`schema.sql` — DEPRECATED reference). Застосовуються через Supabase CLI.

## Структура

```
supabase/
  migrations/            # 001…015 — типи, таблиці, RLS, views, RPC, індекси
  seed.sql               # безпечні довідники (taxonomies/categories) — без секретів
  tests/rls_tests.sql    # відтворювані RLS/authz тести (позитивні+негативні)
  schema.sql             # DEPRECATED — історичний знімок, НЕ застосовувати
scripts/seed-users.mjs   # dev/staging користувачі+адміни через Admin API (паролі з env)
```

## Порядок міграцій

| №   | Файл | Вміст |
|-----|------|-------|
| 001 | extensions_and_types | pgcrypto + усі enum-и |
| 002 | core_identity | `admin_users`, `profiles` (+ `deleted_at`, `admin_notes`) |
| 003 | taxonomies | `taxonomies`, `article_categories` |
| 004 | organizations | `organizations` (+members, access_requests) |
| 005 | articles_foundation | `articles` (versioned body + `content_version` + CHECK) |
| 006 | opportunities | `opportunities`, `applications` (типізовані дати) |
| 007 | events | `events` (date/time/timezone), `event_registrations` |
| 008 | introductions | `introductions` |
| 009 | notifications_bookmarks | `reports`, `bookmarks`, `notifications` |
| 010 | audit_analytics | `audit_log` (розширений), `analytics_events` |
| 011 | rls_helpers | `is_admin`/`has_admin_role`/`current_admin_role` (SECURITY DEFINER, fixed search_path) + `touch_updated_at` |
| 012 | rls_policies | enable RLS + політики (profiles закрито, soft-delete виключено) |
| 013 | public_views | `public_profiles/organizations/articles/opportunities/events` |
| 014 | business_rpc | тригери-барʼєри колонок + `admin_verify_profile/organization`, `admin_block_user/unblock_user`, `handle_new_user` |
| 015 | indexes | часткові індекси на живий контент |

## Runbook — застосування на staging/production

CLI не встановлюється через `npm i -g`. Варіанти встановлення:
```bash
brew install supabase/tap/supabase      # macOS
# або npx: усі команди нижче з префіксом `npx supabase ...`
```

```bash
# 1. Логін (відкриє браузер за access token)
supabase login

# 2. Ініціалізація локального проєкту (створить config.toml поряд з migrations/)
supabase init

# 3. Прив'язати до віддаленого проєкту
supabase link --project-ref esanyyhwabqwmvmisauy
#    (запитає пароль БД — з Supabase → Settings → Database → Connection string)

# 4. Застосувати всі міграції з нуля
supabase db push

# 5. Наповнити довідники (безпечний seed)
psql "$SUPABASE_DATABASE_URL" -f supabase/seed.sql
#    або: supabase db reset  (на STAGING — застосує міграції + seed.sql)

# 6. Створити тестових користувачів/адмінів (dev/staging, паролі з env)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_PASSWORD=... \
  node scripts/seed-users.mjs

# 7. Прогнати RLS/authz тести (мають завершитись без EXCEPTION)
psql "$SUPABASE_DATABASE_URL" -f supabase/tests/rls_tests.sql
```

## Dashboard-налаштування (один раз)

1. **Auth → Providers → Email**: увімкнути Email OTP; за потреби SMTP для розсилки.
2. **Auth → URL Configuration**: додати redirect/callback URL застосунків
   (web-домен, admin-піддомен), якщо використовуються magic-link переходи.
3. **Перший super_admin**: створити користувача (Auth), потім
   `insert into public.admin_users(id,email,role) values ('<auth uid>','you@smr','super_admin');`
   (bootstrap робиться від сервіс-ролі/SQL Editor, бо `admin_users` пише лише super_admin).

## Важливо

- **Не редагувати застосовані міграції.** Будь-яка зміна схеми — нова міграція.
- `service_role` — лише на сервері (Next.js / скрипти). Ніколи в клієнт/Git/логи.
- `DATA_MODE=supabase` у застосунках вмикається ПІСЛЯ успішного `db push` + перевірок.
