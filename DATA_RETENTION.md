# DATA_RETENTION

| Дані | Retention | Примітка |
|------|-----------|----------|
| audit_log | 365+ днів | довше за delivery-логи |
| analytics_events | 180 днів | без private content |
| notifications | 90 днів | soft-delete |
| notification_deliveries | 90 днів | provider msg id, коди помилок |
| email/push logs | 90 днів | без секретів/тіл повідомлень |
| failed jobs | 30 днів після resolve | |
| feedback | до закриття + 180 днів | |
| reports | до рішення + 365 днів | |
| private attachments | доки живе сутність | orphan cleanup job |
| exports (data export) | коротко (24–72 год), signed URL | |
| deleted accounts | soft-delete → grace 30 днів → анонімізація | ділова історія зберігається знеособлено |

Реалізовано: механізми (soft-delete, deletion grace, delivery-лог, консенти).
Автоматичне видалення за retention — cron-job (див. jobs), вмикається перед beta.
