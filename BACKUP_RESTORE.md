# BACKUP_RESTORE

## Що бекапимо
- **Postgres** — керовані бекапи Supabase (щоденні) + PITR (за планом проєкту).
- **Storage** — Supabase-репліка; додатково періодичний експорт критичних bucket-ів.
- **Config** — env-набір (у секрет-менеджері), не в Git.
- **Міграції** — версіоновані у `supabase/migrations` (Git = історія схеми).

## Політика
| Дані | Частота | Retention |
|------|---------|-----------|
| DB daily backup | щодня | 7–30 днів |
| DB PITR | безперервно | за планом |
| Storage export | щотижня | 30 днів |
| Migration history | кожен коміт | безстроково (Git) |

Encryption — на боці провайдера (at-rest). Відповідальний — DevOps owner.

## Restore drill (staging, НЕ поверх production)
1. Створити свіжий бекап.
2. Внести тестову зміну.
3. Відновити в ОКРЕМУ staging-БД.
4. Перевірити версію міграцій (`select max(version)`/останній файл).
5. Перевірити дані та auth-звʼязки (profiles↔auth.users).
6. Перевірити Storage-references.
7. Прогнати smoke (`scripts/apply-remote.mjs --no-tests` на staging + regression).
8. Зафіксувати тривалість у цьому файлі.
9. Оновити runbook.

> Бекап вважається робочим лише після успішного restore drill.
> Статус останнього drill: **очікує виконання на staging** (blocker для GO без обмежень).
