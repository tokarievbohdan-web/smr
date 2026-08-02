# BETA_LAUNCH_PLAN — Closed Beta (Milestone 8)

Операційний план запуску закритої beta. Технічний enablement реалізовано (feature flags,
beta invitations, cohorts, business_outcomes, surveys, beta_metrics, /help). Цей документ —
про **виконання командою SMR** протягом 6–8 тижнів. Числові цілі — орієнтир.

## 0. Гіпотеза
Представники спортивного бізнесу України готові використовувати єдиний професійний
простір для контенту, пошуку людей/організацій, ділових можливостей, подій і керованих
знайомств. Воронка: **Дізнався → Зрозумів → Знайшов → Познайомився → Домовився → Реалізував.**

## 1. Тривалість і масштаб
6–8 тижнів (1 підготовка + 4 активні + 1 аналіз). Аудиторія: 100–200 користувачів,
20–40 організацій, збалансовано (клуби/федерації/бренди/агентства/медіа/стартапи/
організатори/інвестори/спеціалісти + команда SMR).

## 2. Cohorts (feature-flag audience)
SMR Team · Founding Organizations · Content Consumers · Opportunity Publishers ·
Opportunity Applicants · Introduction Users · Event Organizers · Observers.
Керуються через `beta_invitations.cohort` → `profiles.cohorts`; прапорці таргетуються
по cohort (`set_feature_flag audience.cohorts`). Founding Member — cohort `founding` (badge,
без адмін-прав).

## 3. Критерії відбору
Реальна роль в індустрії · готовність заповнити профіль · може шукати/пропонувати
можливість · дає фідбек · приймає закритий статус. Не наповнювати заради кількості.

## 4. Запрошення (flow реалізовано)
Admin → Settings → Beta-запрошення → код (показ один раз, у БД лише sha256).
Лист має містити: що таке SMR, чому запрошено, закритий статус, що очікується, лінк,
термін дії, контакт підтримки. Обмеження: expiration, max_uses, revoke, не дає admin,
не оминає email verification; фіксується в audit+analytics.

## 5. Onboarding і активація
Onboarding пояснює цінність + збирає мінімальний профіль + видає ОДИН CTA за метою
користувача. **Активація (7 днів):** onboarding done + профіль ≥ поріг + ≥2 змістовні дії.
Ціль: 40–60% активовані. Вимірюється `beta_metrics().profiles_completed` + analytics.

## 6. North Star: Meaningful Business Outcomes (Підтверджені бізнес-результати)
Реалізовано `business_outcomes`. Типи: contact_established, meeting_scheduled,
proposal_requested, supplier/candidate/partner_found, investor/sponsorship_conversation,
event_participation, collaboration_started, deal_completed. Публікація — лише за consent.

## 7. Метрики і воронки
`beta_metrics()` (Admin → Analytics): аудиторія, воронки opportunities/introductions/events,
outcomes by type, середні survey-оцінки, cohort-розподіл. Воронки §14 — рахувати
conversion/drop-off/median time між стадіями по cohort з analytics_events.

## 8. Success / Failure signals
**Success (одночасно):** ≥40% onboarding, ≥30% активовані, ≥25% W1-повернення; реальні
пошуки/збереження; 10–20 Opportunities, 20–40 Applications з переходами в contacted/accepted;
10–20 intro-requests, 5–10 sent, підтверджені контакти; події з реальними реєстраціями;
користувачі називають конкретний сценарій цінності. **Failure (§16):** реєструються без
профілів, читають без Network, Opportunities без відгуків, не розуміють відмінність від
LinkedIn, організації не ведуть профілі, повільна модерація, немає повернень. Кожен failure
→ продуктова гіпотеза, не автоматична нова фіча.

## 9. Seed content (§18) — розділення
`is_seed=true` для демо/архівних Opportunities/Events. **У production демо не видається за
реальний бізнес-запит.** Реальні / демо / архівні / staging-fixtures — марковані явно.

## 10. Операції (SLA)
Verification профілю/організації — 1–2 роб. дні. Introductions: review ≤2 дні,
consent ≤5–7 днів, follow-up +7 днів. Support: критичне — того ж дня, доступ — 1 день,
модерація — 2 дні, звичайний фідбек — 3 дні. Черги (§28): profiles/orgs/articles/
opportunities/events/introductions/reports/feedback/failed jobs/delivery failures —
щоденний ранок/день/вечір ритм, власник кожної черги.

## 11. Ролі команди (розділені технічно)
Super Admin · Editor · Moderator · Partnership Manager · Event Manager · Analyst/PO.
Права розділені навіть якщо люди суміщають.

## 12. Тижневий цикл
Пн — аналіз метрик/drop-offs/пріоритети/контент. Вт–Чт — інтервʼю, супровід організацій,
Opportunities/Introductions, критичні багі, малі UX-експерименти. Пт — beta review,
результати експериментів, підтверджені outcomes, рішення. Один експеримент = гіпотеза +
метрика + вікно + аудиторія + критерій рішення. Не міняти багато елементів воронки разом.

## 13. Інтервʼю та опитування
15–25 глибинних інтервʼю по cohorts (скрипт §32). In-product surveys (реалізовано
`/api/surveys`): onboarding «Чи зрозуміло, для чого SMR?», search «Чи знайшли потрібне?»,
application «Наскільки просто?», introduction «Чи релевантний контакт?», event «Чи корисно?».

## 14. Рамка рішення (§61) — після beta
**SCALE** (активація+retention+транзакції+outcomes+бажання організацій) → M9 Public Beta/
монетизація. **ITERATE** (сильні сигнали, нестабільна воронка) → фокус на 1–2 сценарії,
повторна beta. **PIVOT FOCUS** (цінує лише один модуль) → перепозиціонування. **STOP/RETHINK**
(немає стійкого використання/outcomes) → переглянути аудиторію/проблему/модель.

## 15. Exit criteria (§62)
≥4 тижні активного використання · усі cohorts представлені · інтервʼю проведені · funnel
metrics зібрані · retention виміряна · реальні Opportunities/Applications · завершені
Introduction workflows · реальні Event registrations · зафіксовані business outcomes ·
виміряна операційна вартість · технічні проблеми усунені/задокументовані · прийняте рішення.
