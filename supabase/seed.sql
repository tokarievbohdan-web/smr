-- ============================================================
-- Development / staging seed — БЕЗПЕЧНІ довідкові дані.
-- Застосовується автоматично `supabase db reset`, або вручну:
--   psql "$SUPABASE_DATABASE_URL" -f supabase/seed.sql
--
-- НЕ містить паролів і НЕ створює auth.users (користувачі/адміни —
-- через scripts/seed-users.mjs, який бере паролі з env, а не з коду).
-- Ідемпотентно (on conflict do nothing).
-- ============================================================

-- ---------- Категорії статей ----------
insert into public.article_categories (title, slug, "order") values
  ('Аналітика','analytics',1),
  ('Кейси','cases',2),
  ('Інтерв''ю','interviews',3),
  ('Ринок','market',4),
  ('Технології','tech',5),
  ('Право','legal',6)
on conflict do nothing;

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
