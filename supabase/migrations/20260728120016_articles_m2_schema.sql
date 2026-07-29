-- ============================================================
-- 016 · Milestone 2 — Articles: розширення схеми
-- Розширює articles (005), додає authors/tags/relations/revisions/media/
-- slug_history/case_study. Типи та статуси — типізовані enum.
-- articles у prod порожня → безпечно змінюємо типи колонок.
-- ============================================================

-- ---------- enums ----------
do $$ begin
  create type article_type as enum
    ('news','case_study','interview','research','insight','opinion','guide','ranking','partner_material');
exception when duplicate_object then null; end $$;

do $$ begin
  create type article_status as enum ('draft','in_review','scheduled','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type access_level as enum ('public','authenticated');
exception when duplicate_object then null; end $$;

-- ---------- AUTHORS ----------
create table if not exists public.authors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text unique not null,
  avatar_media_id uuid,
  headline       text,
  bio            text,
  profile_id     uuid references public.profiles(id) on delete set null,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- MEDIA FILES ----------
create table if not exists public.media_files (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null,
  path         text not null,
  mime_type    text,
  size_bytes   bigint,
  width        int,
  height       int,
  alt_text     text,
  caption      text,
  is_published boolean not null default false,   -- draft private → published public
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (bucket, path)
);

-- ---------- CATEGORIES: додати опис (решта полів уже є) ----------
alter table public.article_categories add column if not exists description text;
alter table public.article_categories add column if not exists created_at timestamptz not null default now();
create unique index if not exists uq_article_categories_slug on public.article_categories (slug);

-- ---------- TAGS ----------
create table if not exists public.article_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.article_tag_links (
  article_id uuid references public.articles(id) on delete cascade,
  tag_id     uuid references public.article_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ---------- RELATIONS ----------
create table if not exists public.article_relations (
  id                  uuid primary key default gen_random_uuid(),
  article_id          uuid references public.articles(id) on delete cascade,
  related_entity_type text not null,   -- profile|organization|opportunity|event|article
  related_entity_id   uuid not null,
  relation_type       text not null default 'related', -- mentioned|featured|related|author|participant|organizer|partner
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);

-- ---------- REVISIONS ----------
create table if not exists public.article_revisions (
  id              uuid primary key default gen_random_uuid(),
  article_id      uuid references public.articles(id) on delete cascade,
  revision_number int not null,
  snapshot        jsonb not null,
  created_by      uuid references public.profiles(id) on delete set null,
  reason          text,
  created_at      timestamptz not null default now(),
  unique (article_id, revision_number)
);

-- ---------- SLUG HISTORY (redirects) ----------
create table if not exists public.article_slug_history (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  old_slug   text not null,
  created_at timestamptz not null default now(),
  unique (old_slug)
);

-- ============================================================
-- ARTICLES: нові колонки + типізація type/status
-- ============================================================
alter table public.articles add column if not exists slug                 text;
alter table public.articles add column if not exists author_id            uuid references public.authors(id) on delete set null;
alter table public.articles add column if not exists category_id          uuid references public.article_categories(id) on delete set null;
alter table public.articles add column if not exists language             text not null default 'uk';
alter table public.articles add column if not exists reading_time_minutes int;
alter table public.articles add column if not exists scheduled_at         timestamptz;
alter table public.articles add column if not exists archived_at          timestamptz;
alter table public.articles add column if not exists partner_material     boolean not null default false;
alter table public.articles add column if not exists access_level         access_level not null default 'public';
alter table public.articles add column if not exists seo_title            text;
alter table public.articles add column if not exists seo_description      text;
alter table public.articles add column if not exists cover_media_id       uuid references public.media_files(id) on delete set null;
alter table public.articles add column if not exists og_media_id          uuid references public.media_files(id) on delete set null;
alter table public.articles add column if not exists created_by           uuid references public.profiles(id) on delete set null;
alter table public.articles add column if not exists updated_by           uuid references public.profiles(id) on delete set null;
alter table public.articles add column if not exists source_url           text;
alter table public.articles add column if not exists external_source_name text;
alter table public.articles add column if not exists sponsorship_disclosure text;
alter table public.articles add column if not exists canonical_url        text;
alter table public.articles add column if not exists editorial_note       text;
alter table public.articles add column if not exists revision_number      int not null default 0;
alter table public.articles add column if not exists case_study_data      jsonb;
alter table public.articles add column if not exists version              int not null default 1;   -- optimistic concurrency

-- унікальний slug (частковий: ігноруємо soft-deleted)
create unique index if not exists uq_articles_slug on public.articles (slug) where deleted_at is null;

-- public_articles (013) і політика читання (012) залежать від status/type →
-- дропаємо перед зміною типів (перестворюються у 017).
drop view if exists public.public_articles;
drop policy if exists "articles: read published" on public.articles;
-- Часткові індекси з предикатом status='published' (015) прив'язані до старого
-- enum → дропаємо перед зміною типу, перестворюємо в кінці 016.
drop index if exists public.idx_articles_published;
drop index if exists public.idx_articles_featured;
drop index if exists public.idx_articles_category;

-- type text → article_type ("type" — ключове слово, тому в лапках; лише якщо ще text)
do $$ begin
  if (select udt_name from information_schema.columns
       where table_schema='public' and table_name='articles' and column_name='type') = 'text' then
    alter table public.articles alter column "type" set data type article_type using (
      case lower(coalesce("type",''))
        when 'case_study' then 'case_study' when 'кейс' then 'case_study'
        when 'interview' then 'interview'   when 'інтервʼю' then 'interview'
        when 'research' then 'research'      when 'дослідження' then 'research'
        when 'insight' then 'insight'        when 'інсайт' then 'insight'
        when 'opinion' then 'opinion'        when 'думка' then 'opinion'
        when 'guide' then 'guide'            when 'гайд' then 'guide'
        when 'ranking' then 'ranking'        when 'рейтинг' then 'ranking'
        when 'partner_material' then 'partner_material'
        else 'news' end::article_type);
    alter table public.articles alter column "type" set default 'news'::article_type;
  end if;
end $$;

-- status moderation_status → article_status (лише якщо ще moderation_status)
do $$ begin
  if (select udt_name from information_schema.columns
       where table_schema='public' and table_name='articles' and column_name='status') = 'moderation_status' then
    alter table public.articles alter column status drop default;
    alter table public.articles alter column status set data type article_status using (
      case status::text
        when 'review' then 'in_review' when 'pending' then 'in_review'
        when 'published' then 'published' when 'scheduled' then 'scheduled'
        when 'archived' then 'archived' else 'draft' end::article_status);
    alter table public.articles alter column status set default 'draft'::article_status;
  end if;
end $$;

-- ---------- FTS (title/subtitle/excerpt) ----------
alter table public.articles add column if not exists tsv tsvector
  generated always as (to_tsvector('simple',
    coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(excerpt,''))) stored;
create index if not exists idx_articles_tsv on public.articles using gin (tsv);

-- Перестворюємо часткові індекси (тепер прив'язані до article_status)
create index if not exists idx_articles_published on public.articles (published_at desc)
  where deleted_at is null and status = 'published';
create index if not exists idx_articles_featured on public.articles (featured)
  where deleted_at is null and status = 'published';
create index if not exists idx_articles_category on public.articles (category_id)
  where deleted_at is null and status = 'published';
create index if not exists idx_articles_scheduled on public.articles (scheduled_at)
  where status = 'scheduled' and deleted_at is null;
create index if not exists idx_articles_slug_lookup on public.articles (slug) where deleted_at is null;
