# Sport Market Review — опис проєкту, дані та безпека (RLS)

**Sport Market Review (SMR)** — ділова екосистема спортивного бізнесу України
(B2B): клуби, федерації, ліги, бренди, агенції, медіа, інвестори, спеціалісти,
організатори подій, стартапи. Не про рахунки/трансляції/вболівальників.
Мова інтерфейсу — українська. Продуктова логіка:
`Дізнався → Зрозумів → Знайшов → Познайомився → Домовився → Реалізував`.

---

## 1. Застосунки й репозиторій

Монорепо `SMR/`:

| Папка | Що | Стек |
|---|---|---|
| корінь | Мобільний застосунок | Expo (React Native + TS), SDK 54, EAS Build → TestFlight, EAS Update (OTA) |
| `web/` | Десктоп веб-версія | Next.js 16 (App Router) + TS + Tailwind v4 + Manrope |
| `admin/` | Web-адмінпанель (окремо) | Self-contained SPA (HTML/JS), desktop-first |
| `studio/` | CMS редакційного контенту | Sanity |
| `supabase/` | Схема БД + RLS | Postgres (Supabase) |

Спільні: дизайн-система (Manrope, акцент `#2F6BFF`), демо-контент, бренд.

---

## 2. Стан backend

- **Зараз** дані та дії — у локальних сторах (заглушки під Supabase):
  `AuthService`, `networkStore`, `opportunityStore`, `eventStore`, `orgStore`,
  `notificationStore` (мобайл); мок-дані у `web/src/lib/data.ts`.
- **Auth уже мігрує на Supabase** (Етап 2, крок 1): email OTP + таблиця
  `profiles`, вибір бекенду `AuthContext` (Supabase за наявності ключів у
  `src/supabaseConfig.ts`, інакше локальний fallback).
- Схема всіх сутностей із RLS — `supabase/schema.sql`.

---

## 3. Ролі

### Ролі платформи (користувачі)
`profiles.status` — **account_status**: `active`, `pending`, `suspended`,
`blocked`, `deleted`.
Тип користувача — `specialist`, `org_rep`, `student`, `other`.
Прапорець `verified` (верифікація профілю/організації).

### Ролі адмінки (`admin_users.role`) — **admin_role**
| Роль | Доступ |
|---|---|
| **super_admin** | повний доступ до всього |
| **editor** | редакційний контент (матеріали, категорії) |
| **moderator** | користувачі, організації, можливості, події, скарги |
| **partnership_manager** | запити на знайомство |
| **event_manager** | події та реєстрації |
| **analyst** | лише аналітика та експорт |

**Гелпери в БД:**
- `is_admin()` → чи є `auth.uid()` рядком у `admin_users`.
- `has_admin_role(r)` → чи має роль `r` (або `super_admin`, що проходить усе).

---

## 4. Модель безпеки (RLS)

RLS **увімкнено на всіх таблицях**. Доступ визначається `auth.uid()` (поточний
користувач) та адмін-ролями. Загальні принципи:

- Користувач бачить і змінює **свої** дані (`user_id = auth.uid()`).
- Публічний контент (`status='published'`, `verified`) читають усі
  автентифіковані.
- Адмінка працює через `is_admin()` / `has_admin_role()` — операційні дії
  доступні лише відповідним ролям.
- Приватність профілю керується `profiles.settings.privacyPublic`.

### Матриця RLS за таблицями

| Таблиця | READ (select) | WRITE (insert/update) |
|---|---|---|
| **profiles** | власний АБО `privacyPublic` АБО admin | insert лише свій; update свій або admin |
| **organizations** | published/verified АБО власник АБО admin | власник або admin |
| **organization_members** | власне членство або admin | (керується адмінкою) |
| **access_requests** | власні або admin | власні або admin |
| **article_categories** | усі | `editor` |
| **articles** | `published` або admin | `editor` |
| **opportunities** | published АБО автор АБО admin | автор або admin |
| **applications** | заявник АБО автор можливості АБО admin | insert — заявник; update — заявник/автор/admin |
| **events** | `published` або admin | `event_manager` |
| **event_registrations** | власні або admin | власні |
| **introductions** | реквестер АБО `partnership_manager` | insert — реквестер; update — реквестер/PM |
| **reports** | автор скарги АБО `moderator` | insert — автор; update — `moderator` |
| **bookmarks** | власні | власні |
| **notifications** | власні | власні |
| **taxonomies** | усі | admin |
| **admin_users** | себе або admin | `super_admin` |
| **audit_log** | admin | admin (insert) |
| **analytics_events** | `analyst` | self insert |

> Це базовий рівень для MVP. Наступні уточнення (backlog): публічний профіль
> без email через окреме view; тонші політики для контактів (за згодою на
> знайомство); серверні функції для дій адмінки замість прямих update.

---

## 5. Основні сутності (спрощено)

- **profiles** — акаунт (1:1 з `auth.users`): статус, верифікація, тип,
  напрями/спорт/цілі/доступність, `profile` (jsonb: імʼя, посада, організація,
  місто, bio, portfolio), `settings`, крок onboarding.
- **organizations** (+ `organization_members`, `access_requests`) — організації,
  власник, менеджери, запити доступу.
- **articles** (+ `article_categories`) — редакційні матеріали: тип, категорія,
  блоки контенту (jsonb), статус модерації, featured, перегляди/збереження, SEO.
- **opportunities** (+ `applications`) — ділові можливості та відгуки.
- **events** (+ `event_registrations`) — події та реєстрації (registered/
  waitlist/cancelled/attended/noshow).
- **introductions** — запити на знайомство (7 статусів, історія, менеджер).
- **reports** — скарги (обʼєкт, причина, рішення).
- **bookmarks**, **notifications**, **taxonomies** (керовані довідники),
  **admin_users**, **audit_log**, **analytics_events**.

Статуси-довідники: `moderation_status` (draft…archived), `application_status`
(new…withdrawn), `registration_status`, `intro_status`.

---

## 6. Автентифікація

- **Passwordless email OTP** (Supabase Auth). При вході створюється/читається
  рядок у `profiles`. Сесія — в AsyncStorage (мобайл).
- Адміни — окрема таблиця `admin_users` (id = `auth.users.id`, роль).
- Onboarding: 4 кроки, збереження після кожного, продовження незавершеного.

---

## 7. Аудит і аналітика

- **audit_log** — усі дії адміністраторів (актор, роль, дія, обʼєкт, час);
  читання/запис лише admin. В адмінці вже є журнал з фільтром і CSV-експортом.
- **analytics_events** — продуктові події (`user_registered`,
  `opportunity_created`, `event_registered`, `search_performed` тощо):
  self-insert, читання — `analyst`.

---

## 8. Деплой

- **Мобайл**: EAS Update (OTA, канал `production`, runtime `1.0.0`) → TestFlight.
- **Web** (`web/`): Next.js standalone на власному VPS (Ubuntu 24.04) за nginx +
  PM2 + certbot; домен `sportmarket.review`. Деталі — `web/DEPLOY.md`.
- **Адмінка**: статичний хостинг / окремий піддомен.

---

## 9. Підключення Supabase (щоб активувати RLS «наживо»)

1. Створити проєкт Supabase → скопіювати URL + anon key.
2. Виконати `supabase/schema.sql` (таблиці, ENUM-и, RLS-політики).
3. Auth → Email OTP увімкнути.
4. Заповнити `src/supabaseConfig.ts` (мобайл) / env web-застосунку.
5. Додати адмінів у `admin_users`.
Деталі — `supabase/README.md`. Наповнення й обмеження MVP — `DOCS.md`.
