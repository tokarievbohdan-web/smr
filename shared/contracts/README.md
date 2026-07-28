# @shared/contracts — спільний типізований шар

Framework-agnostic контракти для **mobile / web / server**. Без залежностей від
React/Next. БД використовує `snake_case`, домен — `camelCase`; перетворення
**централізовані** тут (не дублювати мапери в застосунках).

```
database row  ↔  domain model  ↔  API response
 (snake_case)     (camelCase)      (ApiResponse<T>)
```

## Модулі

- `ids.ts` — `UUID`, `ISODate`, `ISODateTime` (branded) + безпечні конвертери дат.
- `status.ts` — union-и статусів (дзеркало enum-ів БД).
- `entities.ts` — доменні моделі: `PublicProfile`, `Profile`, `PublicOrganization`,
  `Article`, `Opportunity`, `Event`, `Introduction`, `NotificationItem`, `Taxonomy`…
- `api.ts` — `PaginatedResponse<T>`, `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>`, `ok()/err()`.
- `mappers.ts` — `camelizeKeys`/`snakeizeKeys` + типізовані `rowTo*` (row → domain).
- `articleBody.ts` — версіонований контракт тіла статті + runtime-валідація.
- `fixtures/articleBody.ts` — тестові приклади (валідні/невалідні/невідомий блок).

## Формат тіла статті (versioned)

```ts
type ArticleBodyDocument = { version: number; blocks: ArticleBodyBlock[] };
```

- `version` = `ARTICLE_BODY_VERSION` (наразі `1`); зберігається також у колонці
  `articles.content_version` для індексації/майбутніх міграцій формату.
- Блоки (кожен має стабільний `id`): `paragraph`, `heading`, `image`, `quote`,
  `list`, `table`, `callout`, `embed`.
- **Безпека невідомих блоків:** `validateArticleBody(input)` нормалізує невідомий
  `type` у `{ type: 'unknown', raw }` і додає warning — документ не ламається
  (forward-compatible). Некоректний верхній рівень → `{ ok: false }`.
- На рівні БД `articles.body` має CHECK: обʼєкт з `version` і масивом `blocks`.

```ts
import { validateArticleBody } from '@shared/contracts/articleBody';
const r = validateArticleBody(row.body);
if (r.ok) render(r.doc.blocks);   // r.warnings — список нормалізованих блоків
```

## Використання

- **web**: alias `@shared/*` у `web/tsconfig.json`. У Milestone 1 сервер імпортує
  переважно **типи** (`import type`) — вони стираються й не потрапляють у бандл.
  Runtime-мапери підключаються у Milestone 2 (Articles).
- **mobile**: імпорт відносним шляхом / alias (Metro-resolver додається у M2).

Самотест валідатора/маперів (dev): `npx tsx` над тимчасовим файлом, що імпортує
`validateArticleBody`, `camelizeKeys`, `rowToArticle` — усі кейси проходять.
