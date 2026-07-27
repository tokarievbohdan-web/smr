# Sport Market Review — Архітектура мобільного MVP

> Документ архітектурного фундаменту. Модулі не реалізуються до затвердження цієї основи.
> Мова інтерфейсу: **українська**. Платформа: **iOS + Android** (mobile-first).

## 1. Що це за продукт

**Sport Market Review (SMR)** — не додаток про рахунки/трансляції/вболівальників, а **ділова екосистема спортивного бізнесу України**: клуби, федерації, ліги, бренди, агентства, спеціалісти, медіа, інвестори, організатори подій, стартапи, постачальники послуг, інфраструктурні проєкти.

**Продуктова логіка (воронка):**
`Дізнався → Зрозумів → Знайшов → Познайомився → Домовився → Реалізував`

Кожен таб застосунку покриває крок воронки:

| Крок | Таб | Суть |
|---|---|---|
| Дізнався / Зрозумів | **Review** | Редакційні матеріали з розбором «Чому це важливо» |
| Знайшов / Познайомився | **Network** | Каталог людей і організацій, запити на знайомство |
| Домовився / Реалізував | **Opportunities** | Вакансії, партнерства, тендери, послуги + відгуки |
| (супровід) | **Events** | Заходи, конференції, реєстрація |
| (акаунт) | **Profile** | Профіль, збережене, заявки, верифікація |

## 2. Технологічний стек (наявний — не змінюємо без потреби)

| Шар | Технологія | Статус |
|---|---|---|
| Мобільний застосунок | **Expo (React Native + TypeScript)** | є |
| Дизайн-система | Manrope, синій `#2F6BFF`, світлі поверхні (`src/theme.ts`) | є |
| Локальний стан/кеш | AsyncStorage | є |
| Редакційний контент | **Sanity CMS** (Studio = веб-адмінка контенту) | є |
| Доставка оновлень | **EAS Update (OTA)** + EAS Build → TestFlight | є |
| **Backend (дані/авторизація)** | **Supabase** (Postgres + Auth + RLS + Storage + Realtime) | **план (Етап 2)** |
| Навігація | Кастомна (state-based) → **React Navigation** | план (див. §5) |
| Платформна веб-адмінка | Окремий захищений Next.js на Supabase | план |

**Розподіл джерел даних:**
- **Sanity** — редакційний контент (Article, ArticleCategory, Tag, довідники Sport/ProfessionalCategory/Skill). Редагують контент-редактори у Sanity Studio.
- **Supabase** — усе користувацьке й транзакційне (User, Organization, Opportunity, Event, заявки, реєстрації, знайомства, закладки, сповіщення, скарги, медіа). Тут виконується правило «всі дії користувача зберігаються в БД» та контроль доступу через RLS.

## 3. Високорівнева архітектура

```
┌─────────────────────────────┐
│      Mobile App (Expo RN)     │  iOS / Android
│  UI · Navigation · State      │
└───────────┬─────────┬────────┘
            │         │
     read   │         │  read/write (auth, RLS)
  (public)  │         │
            ▼         ▼
   ┌────────────┐  ┌──────────────────────┐
   │  Sanity    │  │      Supabase         │
   │  (content) │  │  Postgres · Auth ·    │
   │  Studio =  │  │  RLS · Storage ·      │
   │  content   │  │  Realtime · Edge Fn   │
   │  admin     │  └───────────┬───────────┘
   └────────────┘              │
                               ▼
                  ┌─────────────────────────┐
                  │  Platform Admin (web)    │  desktop, захищений
                  │  Next.js · moderation ·  │
                  │  verification · reports  │
                  └─────────────────────────┘
```

- Мобільний застосунок **ніколи не адмініструє платформу** — адмінка окрема (web, desktop).
- Доступ до даних керується на рівні БД (**Supabase RLS**), а не лише в UI.

## 4. Ролі та статуси користувачів

Модель: `account_status` + `is_verified` + членство в організації + `is_admin`. Шість «типів» із ТЗ — це комбінації:

| Тип | Модель | Може |
|---|---|---|
| **guest** | не авторизований | читати публічний контент (Review, публічні профілі, список Events); дії — через auth gate |
| **registered specialist** | `active`, без верифікації | профіль, закладки, відгуки на Opportunities, реєстрація на Events, запити знайомства, коментарі |
| **organization representative** | `active` + `OrganizationMember(role)` | усе вище + керування профілем організації, публікація Opportunities/Events від імені org |
| **verified user** | `active` + `is_verified = true` | «синя галочка» довіри; підвищені ліміти; пріоритет у видачі; повна публікація |
| **suspended user** | `suspended` | лише читання (або блок); заборонені публікації, відгуки, повідомлення |
| **administrator** | `is_admin = true` (тільки web-адмінка) | модерація, верифікація, блокування, скарги, нагляд за контентом |

## 5. Навігація

### Нижнє меню (5 табів)
1. **Review** — стрічка матеріалів
2. **Network** — люди та організації
3. **Opportunities** — можливості
4. **Events** — заходи
5. **Profile** — профіль

### Глобальні елементи
- **Search** — глобальний пошук (матеріали, люди, організації, можливості, події)
- **Notifications** — центр сповіщень (badge на іконці)
- **Back navigation** — жест свайп-назад + кнопка (вже реалізовано `AnimatedScreen`)
- **Deep links** — `smr://article/:id`, `smr://org/:id`, `smr://opportunity/:id`, `smr://event/:id`, `smr://user/:id`
- **Modal screens** — створення/редагування, деталі поверх контексту
- **Bottom sheets** — фільтри, швидкі дії, вибір
- **App states** — loading / empty / error / offline / success (див. §8)
- **Authentication gate** — гостю показуємо контент; на захищеній дії → екран входу

### Рекомендація по навігації
Поточна навігація — кастомна (state-based, `App.tsx`). Для 5 табів + модалок + deep links + bottom sheets пропоную перейти на **React Navigation** (`@react-navigation/native` + `native-stack` + `bottom-tabs` + `@gorhom/bottom-sheet`). Це стандарт RN і закриває всі глобальні елементи «з коробки».
⚠️ Це нативні модулі → потрібна **одна нова збірка** (не лише OTA). Робимо на етапі фундаменту, до нарощування модулів. Наявний `AnimatedScreen`/свайп-назад заміняється рідними переходами React Navigation.

### Карта екранів
```
Auth
  ├─ Onboarding (є)
  ├─ Sign in / Sign up
  └─ Verification request (modal)

Tab: Review
  ├─ Feed (є) — категорії, «Найобговорюваніші»
  ├─ Article detail (є) — «Чому це важливо» + коментарі
  └─ Search (є) — modal

Tab: Network
  ├─ People & Organizations (частково є: Community)
  ├─ Person profile
  ├─ Organization profile
  └─ Introduction request (bottom sheet / modal)

Tab: Opportunities
  ├─ Opportunities list + filters (bottom sheet)
  ├─ Opportunity detail
  ├─ Apply (modal)
  └─ Create/Edit opportunity (org rep, modal)

Tab: Events
  ├─ Events list
  ├─ Event detail
  ├─ Register (modal)
  └─ Create/Edit event (org rep, modal)

Tab: Profile
  ├─ My profile (є) + Verification
  ├─ Saved / Bookmarks (є)
  ├─ My applications / registrations
  ├─ My organization (org rep)
  ├─ Notifications
  └─ Settings
```

## 6. Моделі даних

Спільні правила: усі таблиці мають `id` (uuid), `created_at`, `updated_at`; де вказано — `deleted_at` (**soft delete**). Права — на рівні Supabase RLS.

### User (Supabase Auth + `users`)
- **Обов'язкові:** id, email, account_status (`active`|`suspended`|`deleted`), created_at
- **Необов'язкові:** phone, last_seen_at, is_admin (default false)
- **Статуси:** active / suspended / deleted
- **Зв'язки:** 1–1 UserProfile; 1–N OrganizationMember, Bookmark, Notification, applications
- **Перегляд:** сам + admin; базові поля — публічно через профіль
- **Редагування:** сам (крім status/is_admin — тільки admin)
- **Видалення:** soft delete (`account_status=deleted`); auth-запис — тільки admin

### UserProfile
- **Обов'язкові:** user_id, full_name, professional_category_id
- **Необов'язкові:** avatar (MediaFile), headline, bio, city, organization_id, skills[], sports[], links (linkedin…), is_verified (default false)
- **Статуси:** —
- **Зв'язки:** User 1–1; N–1 ProfessionalCategory, Organization; N–N Skill, Sport
- **Перегляд:** публічно (guest бачить базове); повне — авторизовані
- **Редагування:** власник; `is_verified` — тільки admin
- **Видалення:** soft delete разом з User

### Organization
- **Обов'язкові:** name, type (`club`|`federation`|`league`|`brand`|`agency`|`media`|`startup`|`service`|`other`), created_by
- **Необов'язкові:** logo, description, city, website, sports[], is_verified
- **Статуси:** active / suspended / deleted
- **Зв'язки:** 1–N OrganizationMember, Opportunity, Event
- **Перегляд:** публічно
- **Редагування:** OrganizationMember з роллю `owner`/`admin`; верифікація — admin
- **Видалення:** soft delete; лише org owner або admin

### OrganizationMember
- **Обов'язкові:** organization_id, user_id, role (`owner`|`admin`|`member`), status (`invited`|`active`|`removed`)
- **Зв'язки:** N–1 Organization, User
- **Перегляд:** учасники org + admin
- **Редагування:** org owner/admin
- **Видалення:** hard (зміна status=removed як soft)

### Article (Sanity)
- **Обов'язкові:** title, category, kind (`News`|`Case`|`Insight`)
- **Необов'язкові:** excerpt, image, date, readMin, commentsCount, facts[], why, conclusion, source, topToday, tags[], sport
- **Статуси:** draft / published (Sanity)
- **Зв'язки:** N–1 ArticleCategory; N–N Tag, Sport
- **Перегляд:** published — публічно
- **Редагування:** контент-редактори (Sanity Studio)
- **Видалення:** через Studio (unpublish/delete)

### ArticleCategory / Tag / Sport / ProfessionalCategory / Skill (довідники)
- **Обов'язкові:** name/title, slug
- **Необов'язкові:** description, icon
- **Зв'язки:** використовуються Article / UserProfile / Opportunity
- **Перегляд:** публічно
- **Редагування:** admin / контент-редактор
- **Джерело:** Sport/ProfessionalCategory/Skill — Supabase-довідники (використовуються у фільтрах); ArticleCategory/Tag — Sanity

### Opportunity
- **Обов'язкові:** title, type (`job`|`partnership`|`tender`|`service`|`investment`), owner (user_id або organization_id), status
- **Необов'язкові:** description, category, sport, city, budget, deadline, requirements[], attachments (MediaFile[])
- **Статуси:** draft / open / closed / archived
- **Зв'язки:** N–1 Organization/User; 1–N OpportunityApplication
- **Перегляд:** open — публічно; draft — власник
- **Редагування:** власник (verified/org rep); модерація — admin
- **Видалення:** soft delete; власник або admin

### OpportunityApplication
- **Обов'язкові:** opportunity_id, applicant_id, status
- **Необов'язкові:** message, attachments
- **Статуси:** submitted / viewed / accepted / rejected / withdrawn
- **Зв'язки:** N–1 Opportunity, User
- **Перегляд:** заявник + власник можливості + admin
- **Редагування:** заявник (до перегляду) — withdraw; власник — змінює статус
- **Видалення:** soft (withdrawn)

### Event
- **Обов'язкові:** title, starts_at, owner, status
- **Необов'язкові:** description, cover (MediaFile), ends_at, location/online_url, city, capacity, price, sport, category
- **Статуси:** draft / published / cancelled / finished
- **Зв'язки:** N–1 Organization/User; 1–N EventRegistration
- **Перегляд:** published — публічно
- **Редагування:** власник (verified/org rep); модерація — admin
- **Видалення:** soft delete

### EventRegistration
- **Обов'язкові:** event_id, user_id, status
- **Необов'язкові:** note
- **Статуси:** registered / waitlisted / cancelled / attended
- **Зв'язки:** N–1 Event, User
- **Перегляд:** учасник + організатор + admin
- **Редагування:** учасник (cancel); організатор (attended)
- **Видалення:** soft (cancelled)

### IntroductionRequest (знайомство)
- **Обов'язкові:** from_user_id, to_user_id, status
- **Необов'язкові:** message, context (opportunity/event/article)
- **Статуси:** pending / accepted / declined / expired
- **Зв'язки:** N–1 User (from/to)
- **Перегляд:** обидві сторони + admin
- **Редагування:** отримувач (accept/decline); ініціатор (cancel)
- **Видалення:** soft

### Bookmark
- **Обов'язкові:** user_id, target_type (`article`|`opportunity`|`event`|`user`|`organization`), target_id
- **Статуси:** —
- **Перегляд/редагування:** тільки власник
- **Видалення:** hard delete (зняти закладку)

### Notification
- **Обов'язкові:** user_id, type, created_at, is_read
- **Необов'язкові:** payload (json), target deep-link
- **Статуси:** unread / read
- **Перегляд/редагування:** тільки власник
- **Видалення:** soft/hard (очистка)

### Report (скарга)
- **Обов'язкові:** reporter_id, target_type, target_id, reason, status
- **Необов'язкові:** comment
- **Статуси:** open / reviewing / resolved / rejected
- **Перегляд:** репортер (свій) + admin; обробка — admin (web)
- **Видалення:** admin

### MediaFile
- **Обов'язкові:** owner_id, url/path, kind (`image`|`document`), created_at
- **Необов'язкові:** width, height, size, alt
- **Зберігання:** Supabase Storage (або Sanity assets для контенту)
- **Перегляд:** залежить від батьківської сутності
- **Видалення:** soft/hard разом з батьком

## 7. Permissions matrix (скорочено)

Дії: C=створити, R=читати, U=редагувати, D=видалити. (own = лише своє)

| Сутність / дія | guest | specialist | org rep | verified | suspended | admin |
|---|---|---|---|---|---|---|
| Article | R | R | R | R | R | CRUD (Studio) |
| Comment | – | CRU(own) | CRU(own) | CRU(own) | R | D |
| Bookmark | – | CRUD(own) | CRUD(own) | CRUD(own) | – | – |
| UserProfile | R(base) | RU(own) | RU(own) | RU(own) | R | RUD |
| Organization | R | R | RU(own) | RU(own) | R | RUD |
| Opportunity | R | R | CRU(own)\* | CRU(own) | R | RUD |
| OpportunityApplication | – | CR(own) | CR(own) | CR(own) | – | R |
| Event | R | R | CRU(own)\* | CRU(own) | R | RUD |
| EventRegistration | – | CR(own) | CR(own) | CR(own) | – | R |
| IntroductionRequest | – | CR(own) | CR(own) | CR(own) | – | R |
| Report | – | C(own) | C(own) | C(own) | – | RUD |

\* публікація Opportunity/Event — тільки після верифікації організації/представника (інакше draft/на модерацію).

RLS-принцип: читання публічного контенту дозволене всім; будь-який запис прив'язаний до `auth.uid()`; `suspended` — лише SELECT; `admin` — окремі політики.

## 8. Стани застосунку (обов'язково для кожного модуля)
- **loading** — скелетони/спінер (не порожній екран)
- **empty** — дружнє порожнє + CTA (без «нічого немає»)
- **error** — що сталося + «Повторити»
- **offline** — банер + кеш останніх даних (AsyncStorage/Supabase cache)
- **success** — тост/стан кнопки після дії
- **auth gate** — гість бачить контент; на дії → вхід

## 9. Структура папок (цільова)
```
src/
  app/               навігація (React Navigation): tabs, stacks, modals, linking(deep links)
  screens/
    review/  network/  opportunities/  events/  profile/  auth/
  components/        дизайн-система (Photo, Chip, Avatar, CommentItem, states…)
  features/          доменна логіка по модулях (hooks, api-виклики)
  services/
    supabase.ts      клієнт + auth
    sanity.ts        клієнт контенту (є як cms.ts/api.ts)
  models/            типи сутностей (§6)
  state/             ContentContext (є) + AuthContext + провайдери
  theme.ts (є)  ui-states/ (loading/empty/error/offline)
studio/              Sanity Studio — контент-адмінка (є)
admin-web/           платформна веб-адмінка (Next.js, пізніше)
docs/                документація (цей файл)
```

## 10. Базові UI-компоненти (наявна дизайн-система)
Є: `Photo`, `CategoryText`, `ImageBadge`, `Avatar`, `Chip`, `Logo`, `CommentItem`, `CommentComposer`, `AnimatedScreen`, `FadeView`, таб-бар, картки.
Додати як фундамент: `Button` (variants+loading), `TextField`+валідація, `Sheet` (bottom sheet), `Skeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`, `Badge` (verified/status), `Toast`, `AuthGate`.

## 11. Основа адмінки
- **Контент** — Sanity Studio (готово): матеріали, категорії, теги, довідники.
- **Платформа** — окремий Next.js на Supabase (пізніше): користувачі, верифікація, блокування, скарги, модерація Opportunities/Events. Захист: Supabase Auth + роль admin + RLS. Мобільний застосунок цим не займається.

## 12. Поточний стан vs ціль
| Є зараз | Ціль (після затвердження) |
|---|---|
| 3 таби (Головна, Спільнота, Профіль) | 5 табів (Review, Network, Opportunities, Events, Profile) |
| Кастомна навігація | React Navigation + deep links + modals + sheets |
| Дані: Sanity (контент) + моки | Sanity (контент) + Supabase (користувачі/транзакції) |
| Немає авторизації | Supabase Auth + ролі + RLS + auth gate |
| Дії в пам'яті сесії | Усі дії зберігаються в БД |
| Немає Opportunities/Events | Повні модулі |

## 13. Наступні етапи (пропозиція)
1. **PROMPT 01 (цей) — затвердження архітектури.**
2. Фундамент: React Navigation (5 табів + модалки + deep links), UI-states, базові компоненти. Одна нативна збірка.
3. Supabase: схема БД (§6), Auth, RLS, AuthContext, auth gate.
4. Модуль **Network** (профілі, організації, знайомства).
5. Модуль **Opportunities** (+ заявки).
6. Модуль **Events** (+ реєстрації).
7. Notifications, Reports, верифікація.
8. Платформна веб-адмінка (Next.js/Supabase).
9. Наповнення реалістичними даними (укр.), QA, production build.

---
_Модулі не реалізуються, доки цей фундамент не затверджено._
