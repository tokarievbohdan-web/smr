# INCIDENT_RESPONSE

## Severity
- **SEV1** — витік даних/ключа, RLS-bypass, БД недоступна, масове видалення.
- **SEV2** — збій критичного flow (auth/реєстрація/модерація), email/push масово падають.
- **SEV3** — часткова деградація, некритичні помилки.

## Ролі
- Incident owner (черговий інженер) — координує.
- Security owner — ротація ключів, блокування.
- Comms — комунікація з користувачами/командою.

## Кроки
1. **Виявлення** — алерти (failed admin login, role change, delivery failures, health).
2. **Зупинка шкоди** — увімкнути `maintenance mode` (flag), вимкнути проблемний модуль
   (feature flag), заблокувати акаунт (`admin_users.status=suspended` / user block).
3. **Ротація** — при витоку: roll `service_role`, revoke PAT, змінити `CRON_SECRET`
   (див. SECURITY_ENVIRONMENT.md).
4. **Відновлення** — з бекапу (BACKUP_RESTORE.md), перевірити RLS-тести.
5. **Комунікація** — статус beta-користувачам.
6. **Postmortem** — таймлайн, причина, запобіжники.

## Сценарії
| Інцидент | Перша дія |
|----------|-----------|
| Витік service_role | roll ключа → revoke PAT → перезапуск web |
| Компрометація admin | suspend admin_users → примусовий logout → аудит дій |
| БД недоступна | maintenance mode → перевірка Supabase status → readiness |
| Email/push abuse | вимкнути email/push flag → suppression list |
| Corrupted migration | rollback plan (DATABASE) → restore staging → apply-fix |
| Випадкове видалення | soft-delete → відновлення з бекапу за вікном retention |
| Storage exposure | зробити bucket private → перегенерувати signed URLs |
| RLS bypass | вимкнути модуль flag → hotfix політики → regression suite |
