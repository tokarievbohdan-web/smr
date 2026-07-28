# Sport Market Review — Адмінпанель

Окрема захищена web-панель для команди SMR. **Не є частиною мобільного застосунку**
(desktop-first, окремий деплой). Реалізовано основу (PROMPT 12):

- Admin authentication (службові акаунти + пароль)
- Desktop-first layout із sidebar-навігацією
- Role-based access — 6 ролей із матрицею дозволів:
  - **Super Admin** — повний доступ
  - **Editor** — редакційний контент
  - **Moderator** — користувачі, організації, можливості, події, скарги
  - **Partnership Manager** — запити на знайомство
  - **Event Manager** — події та реєстрації
  - **Analyst** — лише аналітика й експорт
- Dashboard — 15 метрик + блок «Потребує уваги»
- Базова навігація по всіх розділах
- Audit logging foundation (журнал дій із фільтром та експортом)
- Responsive tables, фільтри, bulk actions, confirmation dialogs,
  внутрішні нотатки, export CSV

## Запуск

Статичний односторінковий застосунок (без збірки):

```bash
cd admin && python3 -m http.server 8090
# відкрити http://localhost:8090
```

## Демо-акаунти

`super@smr.ua`, `editor@smr.ua`, `moderator@smr.ua`, `partner@smr.ua`,
`events@smr.ua`, `analyst@smr.ua`

> Демо-пароль не публікується у репозиторії. За замовчуванням у коді — `demo`;
> для власного значення задайте `window.SMR_DEMO_PASSWORD` через некомічений
> `config.local.js` або nginx. Це **тимчасова клієнтська** автентифікація —
> замінюється серверною (Supabase Auth + `admin_users`) у Milestone 1; поки що
> справжній захист — HTTP Basic Auth на nginx (ротуйте пароль після демо).

## Наступні кроки

Підключити реальний backend (Supabase): автентифікація адмінів, RLS за ролями,
серверний audit trail, реальні дані замість демо-набору у `index.html`.
