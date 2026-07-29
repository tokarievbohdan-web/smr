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

---

# Milestone 2 — Articles (єдиний редакційний контур)

Supabase — **єдине джерело правди** для матеріалів. Ланцюг:
`Admin CMS → Next API → PostgreSQL RPC → articles/revisions/relations → Web SSR → (Mobile) → bookmarks/analytics/audit`.

## Схема (міграції 016–018)
- `articles` (розширено): `slug` (unique), `type` (enum `article_type`), `status`
  (enum `article_status`), `access_level`, `author_id`, `category_id`,
  `scheduled_at`/`archived_at`, `case_study_data`, `version` (concurrency),
  `content_version`, SEO, FTS `tsv`.
- Нові: `authors`, `article_categories` (12 канонічних), `article_tags`(+links),
  `article_relations`, `article_revisions`, `media_files`, `article_slug_history`.

## Статуси й переходи
`draft → in_review → (scheduled) → published → archived` (+ повернення в draft,
restore-revision → новий draft). **Критичні поля** (status/published_at/
scheduled_at/archived_at/featured/slug/created_by) змінюються ЛИШЕ через RPC:
тригер-барʼєр пропускає їх тільки за `app.privileged_write=1`, який ставлять
SECURITY DEFINER RPC. Прямий client-update їх не змінює.

## Дозволи
`editor`+ (і `super_admin`) — CRUD/submit/publish/schedule/archive/restore.
`moderator` без editor — не публікує. `analyst` — лише читання аналітики.
Звичайний користувач — читає public (і authenticated після входу), зберігає, ділиться.

## API (Next.js Route Handlers)
Public: `GET /api/articles`, `GET /api/articles/[slug]`.
Admin (роль editor): `GET/POST /api/admin/articles`, `GET/PATCH /api/admin/articles/[id]`,
`…/submit|publish|schedule|archive|revisions|restore-revision`.
User: `POST /api/bookmarks`, `DELETE /api/bookmarks/[type]/[id]`, `GET /api/me/bookmarks`,
`POST /api/analytics`. Cron: `POST /api/cron/publish-scheduled` (service_role + `CRON_SECRET`).
Читання — anon або user-JWT (RLS вирішує); записи — RPC від імені editor (роль
перевіряється в БД). optimistic concurrency через `version`/`expectedVersion` → 409.

## RPC (атомарні, SECURITY DEFINER, audit + revision)
`create_article_draft`, `update_article_draft`, `submit_article_for_review`,
`return_article_to_draft`, `schedule_article`, `publish_article` (валідація title/
author/category/body), `archive_article`, `restore_article_revision`,
`change_published_slug` (+ slug_history редірект), `publish_due_scheduled` (cron, ідемпотентний).

## Web
`DATA_MODE=supabase` → SSR з Supabase (`/`, `/review`, `/review/[slug]`),
метадані + JSON-LD `NewsArticle`, декод кирилиці slug, редірект зі старого slug.
`DATA_MODE=mock` → локальні fixtures (лише dev; **без тихого fallback** у проді).
Ревалідація (`revalidatePath`) після publish/archive/slug/featured — точкова, не rebuild.

## Preview / Media / Scheduled
Preview чернетки — у CMS (клієнтський рендер; серверні preview-токени — далі).
Media — таблиця `media_files` (+RLS: чернеткові приватні); signed-upload flow — далі.
Scheduled — cron дергає `/api/cron/publish-scheduled` (VPS cron / Supabase scheduled),
не залежить від браузера.

## Import / Rollback
Staging-import demo-статей: `scripts/import-demo-articles.ts` (mock→UUID/ISO/Body v1,
mapping-артефакт, ідемпотентно, не автозапуск у проді).
**Rollback:** повернути `DATA_MODE=mock` на web → сайт знову на fixtures; схема/дані
Supabase лишаються (міграції адитивні, `deleted_at`/`archived` замість фізичного видалення).
