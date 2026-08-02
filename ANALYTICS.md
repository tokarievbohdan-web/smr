# ANALYTICS

## Події
`analytics_events(user_id, event, props jsonb, created_at)`. Пишуться в атомарних RPC
(`_net_analytics`). **Без private content** у props.

Приклади подій: event_created/submitted/approved/registered/waitlisted, waitlist_offer_*,
registration_cancelled, event_rescheduled/cancelled/attendance_marked, opportunity_*,
introduction_* тощо. Конвенція іменування: `<domain>_<action>`.

## Метрики (server-side агрегація)
`admin_metrics()` (будь-який адмін): users_total, profiles_verified, orgs_approved,
articles_published, opportunities_active, applications_total, introductions_total,
events_published, registrations_total, reports_open, feedback_new, moderation_backlog,
delivery_failures.

`data_quality_report()` (analyst/super_admin): профілі без імені, організації без власника,
події понад місткість, waitlist-офери без терміну, прострочені активні можливості,
знайомства без сторони, сповіщення без обʼєкта.

Admin dashboard споживає їх через `/api/admin/metrics` і `/api/admin/data-quality`
(агрегація на сервері; raw-події в браузер не вантажаться).

## Retention
analytics — 180 днів (DATA_RETENTION.md). Consent на аналітику — за обраною моделлю
(`user_consents`, type=analytics).
