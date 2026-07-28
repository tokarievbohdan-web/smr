-- ============================================================
-- 003 · Taxonomies (керовані довідники)
-- kind: sport|direction|skill|org_type|opp_type|event_type|
--       content_category|tag|region|city|language
-- Єдине джерело довідників для застосунку та адмінки.
-- ============================================================

create table if not exists public.taxonomies (
  id      uuid primary key default gen_random_uuid(),
  kind    text not null,
  value   text not null,
  slug    text,
  active  boolean not null default true,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, value)
);

-- Довідник категорій статей (окрема таблиця — historically referenced by CMS)
create table if not exists public.article_categories (
  id     uuid primary key default gen_random_uuid(),
  title  text not null,
  slug   text,
  "order" int not null default 0,
  active boolean not null default true
);
