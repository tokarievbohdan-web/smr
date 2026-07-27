# Sport Market CMS — веб-адмінка контенту (Sanity Studio)

Тут редактори додають і редагують **матеріали, обговорення та учасників**.
Застосунок читає цей контент через API (`../src/api.ts`).

## Перший запуск (одноразово)

```bash
cd studio
npm install
npx sanity login          # створити безкоштовний акаунт / увійти (відкриється браузер)
npx sanity init           # → "Create new project" → назва "Sport Market CMS" → dataset: production
```

`init` покаже **Project ID**. Якщо запитає перезаписати `sanity.config.ts` — обери **No** (лишаємо наші схеми).

Далі:
1. Створи файл `studio/.env` і встав:
   ```
   SANITY_STUDIO_PROJECT_ID=твій_project_id
   ```
2. Дай застосунку читати контент (публічний dataset):
   ```bash
   npx sanity dataset visibility set production public
   ```
3. Впиши той самий `projectId` у застосунку — у файлі `../src/cms.ts`.

## Запуск адмінки

- Локально (для себе): `npm run dev` → http://localhost:3333
- **Опублікувати в інтернет** (щоб редактори заходили з будь-якого браузера):
  ```bash
  npm run deploy
  ```
  → отримаєш адресу виду `https://sport-market.sanity.studio`

## Ролі / доступ

Керуй запрошеннями редакторів на https://sanity.io/manage → твій проєкт → Members.
