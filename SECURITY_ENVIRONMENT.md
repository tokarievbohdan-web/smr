# SECURITY_ENVIRONMENT

Опис середовищ та секретів SMR. **Реальні значення тут не зберігаються.**

## Середовища
| env | БД | Storage | Email sender | Admin origin |
|-----|----|---------|--------------|--------------|
| local | локальна/тестова | префікс `local/` | dev/console | http://localhost |
| development | dev-проєкт | `dev/` | dev | dev-URL |
| staging | staging-проєкт | `staging/` | staging | staging-URL |
| production | production-проєкт | `prod/` | verified domain | admin.<domain> |

Production **ніколи** не використовує: mock data, staging БД/Storage, dev email sender,
dev deep links, demo-admin, localhost callback. Це гарантує `validateProductionEnv()` у
`web/src/server/env.ts` (fail-fast при несумісній конфігурації).

## Секрети (лише через server env)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, оминає RLS. Ніколи не в клієнт/бандл/логи.
- `CRON_SECRET` — заголовок `x-cron-secret` для `/api/cron/*`.
- email/push/observability ключі — server env.

Публічні (можна в клієнт): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Правила
- секрети не в Git; `.env.example` містить лише назви;
- staging і production — РІЗНІ секрети;
- розкриті колись credentials — ротувати (див. нижче);
- Personal Access Token (Supabase Management API) використовується разово для міграцій і
  відкликається одразу після застосування.

## Ротація (обовʼязково перед beta)
1. Supabase → Settings → API Keys → **Roll `service_role`**; новий ключ лише в server env.
2. Account → Access Tokens → **Revoke** усі PAT, використані для apply-remote.
3. Оновити VPS env, перезапустити web (PM2).
