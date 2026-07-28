# SMR — архітектура уніфікованого бекенду (Milestone 1)

Зафіксовані рішення для інтеграції mobile + web + admin на спільному Supabase.

## Source of truth

**Supabase (Postgres)** — єдине джерело правди для: користувачів, профілів,
організацій, статей, можливостей, відгуків, подій, реєстрацій, знайомств,
сповіщень, закладок, довідників, адмін-ролей, аудиту.

**Sanity Studio (`studio/`) — PARKED / experimental / not connected to production.**
Не видаляється, не синхронізується з Supabase. Контент статей веде Supabase
(`articles`, versioned body).

## Server operations

```
Client (mobile / web / admin SPA)
  → Next.js Route Handler (web/src/app/api)   ← довірена серверна межа
     · верифікує Supabase JWT
     · перевіряє активний запис у admin_users + роль
     · CORS (лише ADMIN_ORIGIN), rate-limit, request_id, audit context
  → PostgreSQL RPC (SECURITY DEFINER, fixed search_path)  ← атомарні переходи
     · повторно перевіряє роль через auth.uid() (не довіряє клієнту)
     · змінює дані атомарно + пише audit_log
  → Supabase tables (RLS)
```

Supabase Edge Functions на цьому етапі не використовуються.

Виклик RPC йде від імені адміна (його JWT), тож `auth.uid()` у БД = адмін, і
перевірка ролі відбувається на сервері БД. `service_role` застосовується лише
там, де треба оминути RLS без ідентичності (напр. читання `admin_users` для
guard), і ніколи не потрапляє в клієнт.

## Secrets

| Ключ | Де живе | Заборонено |
|------|---------|-----------|
| anon / publishable | mobile + web client, admin SPA | — (публічний) |
| `service_role` | лише web-сервер + скрипти (env) | client bundle, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, admin SPA, Git, логи |
| DB password / `SUPABASE_DATABASE_URL` | сервер/скрипти (env) | Git, клієнт |

Production guard: `DATA_MODE=supabase` без ключів → контрольована помилка
запуску (mobile `src/supabase.ts`, web `src/server/env.ts`), **без тихого
fallback на mock**. `DATA_MODE=mock` — лише явний вибір для розробки.

## Identity

Один `auth.users.id` для mobile і web (Email OTP). `profiles.id = auth.users.id`;
профіль автостворюється тригером `handle_new_user`. Той самий email в обох
застосунках → той самий user id.

## Data model

- PK/FK — `uuid`; час — `timestamptz`; календарні дати — `date`; API → ISO 8601;
  форматування дат лише в UI.
- **Soft delete** — `deleted_at timestamptz` на profiles/organizations/articles/
  opportunities/events/applications/introductions/notifications; публічні views і
  RLS виключають `deleted_at is not null`. Фізичне видалення — лише
  адміністративним рішенням/скриптом, не звичайною дією користувача.

## Захист даних (RLS + column guards)

- RLS захищає **рядок**; тригери-барʼєри (014) захищають **колонку**: звичайний
  користувач/власник не може змінити `verified/featured/status/admin_notes/
  deleted_at/email/owner_id`. Привілейований гейт — `has_admin_role('moderator')`
  (super_admin проходить завжди); analyst/editor/event_manager/partnership_manager
  не можуть змінювати чужі профілі/організації.
- Публічні дані — лише через `public_*` views (без email/приватних полів,
  без чернеток і видалених). Базові таблиці не віддаються клієнту як `select *`.

## Що НЕ входить у Milestone 1

Продуктовий UI Articles/CMS/Bookmarks/Opportunities/Applications/Events/
Introductions, push, email-розсилки, аплоуд файлів, аналітичні дашборди, Sanity —
готуються схема/контракти/API foundation, але не інтегруються (Milestone 2+).
