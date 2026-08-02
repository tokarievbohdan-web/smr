# NOTIFICATIONS

## Єдина модель доставки
```
Domain event (RPC)
  → notification (in_app, таблиця notifications)
  → notification_deliveries (channel: in_app | push | email)
     → push (Expo)   [foundation]
     → email (provider) [foundation]
  → delivery status (queued|sent|delivered|failed|suppressed)
```
Один domain-event → один `notifications` рядок + N `notification_deliveries` (по каналу).
Не три незалежні джерела істини.

## Канали і налаштування
`notification_preferences` (per-user): `channels{in_app,push,email}`, `categories{<cat>:{...}}`,
`quiet_hours_start/end`, `timezone`, `reminder_frequency`.
Категорії: editorial, opportunities, applications, introductions, events, organization,
account, **security**. Security **не можна вимкнути** (примусово вмикається в RPC).

## Push (Expo, mobile на паузі)
`devices` (per-user push tokens): register/refresh через `register_device`, cleanup при
logout (`invalidate_my_devices`), інвалідизація токена у попереднього власника. Токен не
логується, не потрапляє в public API.

## Email (foundation)
`notification_deliveries` фіксує метадані (template/status/attempts/provider_message_id/
failure_code). Провайдер (Resend/Postmark) + verified domain (SPF/DKIM/DMARC) — підключити
перед beta. Transactional-повідомлення не залежать від marketing-підписки; unsubscribe —
лише для необовʼязкових.

## Типи (скорочено)
Opportunities: approved/changes/new application/status/deadline. Introductions: info/consent/
approved/sent/follow-up. Events: registration/waitlist offer/reminder/rescheduled/cancelled/
online link. System: verification/org access/security.
