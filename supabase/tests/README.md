# supabase/tests

## regression.mjs — консолідований RLS/бізнес regression (одна команда)
Застосовує ВСІ міграції з нуля у PGlite (WASM Postgres), проганяє негативні/позитивні
RLS-перевірки та бізнес-інваріанти всіх модулів (M2–M7): trigger-барʼєри, капасіті/waitlist
без overbooking, приватність introductions/events, feature-flags audience, beta-invite→cohort,
notification-preferences security-lock, push-token transfer, consent, feedback RLS,
account deletion/export isolation, admin metrics/data-quality gating.

```bash
npm i -D @electric-sql/pglite        # разова залежність для тестів
node supabase/tests/regression.mjs   # 0 = усі пройшли
```

## rls_tests.sql — живі RLS-тести
Проганяються на реальній БД через `scripts/apply-remote.mjs` (після міграцій + seed).
