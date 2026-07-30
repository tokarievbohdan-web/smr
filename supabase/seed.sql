-- ============================================================
-- Development / staging seed — БЕЗПЕЧНІ довідкові дані.
-- Застосовується автоматично `supabase db reset`, або вручну:
--   psql "$SUPABASE_DATABASE_URL" -f supabase/seed.sql
--
-- НЕ містить паролів і НЕ створює auth.users (користувачі/адміни —
-- через scripts/seed-users.mjs, який бере паролі з env, а не з коду).
-- Ідемпотентно (on conflict do nothing).
-- ============================================================

-- ---------- Категорії статей (Milestone 2 — канонічні 12) ----------
insert into public.article_categories (title, slug, description, "order") values
  ('Індустрія','industry','Загальні тренди спортивного бізнесу',1),
  ('Врядування','governance','Управління, регуляції, федерації',2),
  ('Комерція','commercial','Спонсорство, продаж прав, монетизація',3),
  ('Маркетинг','marketing','Бренд, кампанії, аудиторія',4),
  ('Кейси','case-studies','Розбори кампаній і практик',5),
  ('Інсайти','insights','Аналітика й висновки',6),
  ('iGaming','igaming','Ставки, iGaming-партнерства',7),
  ('Медіа','media','Права, продакшн, дистрибуція',8),
  ('Технології','technology','Спорттех, дані, продукти',9),
  ('Інфраструктура','infrastructure','Стадіони, обʼєкти, операції',10),
  ('Інвестиції','investments','Угоди, M&A, фандрейзинг',11),
  ('Масовий спорт','community-sport','Ком’юніті та масовий спорт',12)
on conflict (slug) do nothing;

-- ---------- Автори ----------
insert into public.authors (name, slug, headline, active) values
  ('Редакція SMR','smr-editorial','Команда Sport Market Review', true),
  ('Марія Левченко','maria-levchenko','Авторка, спортивний маркетинг', true)
on conflict (slug) do nothing;

-- ---------- Типи організацій (Milestone 3) ----------
insert into public.organization_types (code, title, "order") values
  ('club','Клуб',1),('federation','Федерація',2),('league','Ліга',3),('brand','Бренд',4),
  ('agency','Агенція',5),('media','Медіа',6),('sports_tech','Спорттех',7),('startup','Стартап',8),
  ('investor','Інвестор',9),('fund','Фонд',10),('venue','Обʼєкт/Арена',11),('academy','Академія',12),
  ('sports_school','Спортшкола',13),('ngo','Громадська організація',14),('government_organization','Державна організація',15),
  ('event_organizer','Організатор подій',16),('production','Продакшн',17),('service_provider','Постачальник послуг',18),('other','Інше',19)
on conflict (code) do nothing;

-- ---------- Типи можливостей (Milestone 4) ----------
insert into public.opportunity_types (slug, title_uk, sort_order, requires_budget) values
  ('sponsorship','Спонсорство',1,false),('partnership','Партнерство',2,false),('vacancy','Вакансія',3,false),
  ('project_work','Проєктна робота',4,false),('tender','Тендер',5,true),('service_request','Пошук підрядника',6,false),
  ('investment','Інвестиції',7,false),('grant','Грант',8,false),('media_partnership','Медіапартнерство',9,false),
  ('ambassador_search','Пошук амбасадора',10,false),('venue_search','Пошук локації',11,false),
  ('speaker_search','Пошук спікера',12,false),('volunteering','Волонтерство',13,false),('other','Інше',14,false)
on conflict (slug) do nothing;

-- ---------- Типи знайомств (Milestone 5) ----------
insert into public.introduction_types (slug, title_uk, sort_order) values
  ('partnership','Партнерство',1),('sponsorship','Спонсорство',2),('investment','Інвестиції',3),
  ('service_request','Запит на послуги',4),('employment','Працевлаштування',5),('project_collaboration','Спільний проєкт',6),
  ('media_request','Медіазапит',7),('speaker_request','Запрошення спікера',8),('event_invitation','Запрошення на подію',9),
  ('expert_consultation','Експертна консультація',10),('organization_access','Доступ до організації',11),
  ('opportunity_follow_up','Продовження щодо можливості',12),('other','Інше',13)
on conflict (slug) do nothing;

-- ---------- Taxonomies ----------
insert into public.taxonomies (kind, value, slug, "order") values
  ('sport','Футбол','football',1),
  ('sport','Баскетбол','basketball',2),
  ('sport','Теніс','tennis',3),
  ('sport','Єдиноборства','martial-arts',4),
  ('direction','Маркетинг','marketing',1),
  ('direction','Медіа','media',2),
  ('direction','Менеджмент','management',3),
  ('direction','Інфраструктура','infrastructure',4),
  ('org_type','Клуб','club',1),
  ('org_type','Федерація','federation',2),
  ('org_type','Ліга','league',3),
  ('org_type','Агенція','agency',4),
  ('org_type','Бренд','brand',5),
  ('opp_type','Вакансія','job',1),
  ('opp_type','Тендер','tender',2),
  ('opp_type','Партнерство','partnership',3),
  ('event_type','Конференція','conference',1),
  ('event_type','Воркшоп','workshop',2),
  ('event_type','Нетворкінг','networking',3),
  ('content_category','Аналітика','analytics',1),
  ('content_category','Кейси','cases',2),
  ('region','Київ','kyiv',1),
  ('region','Львів','lviv',2),
  ('region','Одеса','odesa',3),
  ('language','Українська','uk',1),
  ('language','English','en',2)
on conflict (kind, value) do nothing;
