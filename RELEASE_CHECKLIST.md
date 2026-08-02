# RELEASE_CHECKLIST

## Pre-deploy (web)
- [ ] `npm run lint` (за наявності) + `npx tsc --noEmit`
- [ ] `node supabase/tests/regression.mjs` — RLS/бізнес-інваріанти (PGlite)
- [ ] `scripts/apply-remote.mjs` на staging — міграції + seed + rls_tests
- [ ] env validation (APP_ENV=production, ключі, CRON_SECRET, ADMIN_ORIGIN)
- [ ] `npm run build` OK

## Deploy (web, VPS)
- [ ] backup БД (див. BACKUP_RESTORE.md)
- [ ] застосувати міграції (forward-only; add→backfill→switch→remove-later)
- [ ] deploy build → PM2 reload
- [ ] `/api/health/ready` = 200
- [ ] smoke (див. нижче)

## Admin
- [ ] build/deploy статичного SPA → правильний ADMIN_ORIGIN
- [ ] permissions smoke: unauth → 401, EM бачить події, super бачить flags

## Mobile (на паузі)
- [ ] env validation → EAS build → канал → staged rollout → OTA-сумісність

## Smoke (не змінює реальні дані без cleanup)
- [ ] web home / article / network / opportunity / event сторінки
- [ ] login, admin login
- [ ] protected API → 401 без токена
- [ ] `/api/health`, `/api/health/ready`
- [ ] audit write (будь-яка модерн-дія лишає запис)

## Rollback
- web: попередній build + PM2 revert; **не** відкочувати міграції без перевірки сумісності.
- db: forward-fix переважно; destructive-rollback лише за планом міграції.
