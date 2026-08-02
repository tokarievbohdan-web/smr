# BETA_RUNBOOK

Операційні дії для закритої beta. Усе — через довірений Next API / адмінку.

- **Запросити користувача**: Admin → Settings → Beta-запрошення → створити (cohort/email);
  код показується ОДИН раз (у БД лише хеш). Користувач: `POST /api/beta/redeem {code}`.
- **Створити адміна**: `scripts/make-admin.mjs` (роль з admin_role) або INSERT у admin_users
  (service-role). Ролі: super_admin/moderator/editor/partnership_manager/event_manager/analyst.
- **Заблокувати акаунт**: user → status=blocked; адмін → admin_users.status=suspended.
- **Увімкнути/вимкнути модуль**: Settings → Feature flags → toggle (напр. events_enabled,
  registrations_enabled, maintenance_mode). Audience: cohorts/orgs/users.
- **Перевірити jobs**: `POST /api/cron/events` та `/api/cron/introductions` з `x-cron-secret`;
  результат — лічильники published/completed/expired.
- **Повторити email/push**: (foundation) — після підключення провайдера: retry за
  notification_deliveries.status='failed'.
- **Відновити сутність**: зняти deleted_at (service-role/RPC) у межах retention.
- **Обробити report**: Admin → Reports.
- **Скасувати подію**: Admin → Події → детально → «Скасувати» (публічна причина).
- **Закрити можливість**: Admin → Можливості → close.
- **Зупинити знайомство**: Admin → Знайомства → decline/close.
- **Maintenance mode**: Settings → feature flag `maintenance_mode` = on.
- **Rollback**: RELEASE_CHECKLIST.md.
- **Інцидент**: INCIDENT_RESPONSE.md; owner — черговий інженер.

## Cohorts
SMR team, editorial, club reps, federation reps, brands, agencies, specialists,
event organizers, investors, test users. Приклад staged-rollout: Events спершу для
`SMR team` (flag audience), Introductions — для verified, Opportunities — для організацій.
