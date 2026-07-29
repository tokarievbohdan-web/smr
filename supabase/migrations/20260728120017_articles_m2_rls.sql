-- ============================================================
-- 017 · Milestone 2 — Articles: RLS, guard, public view
-- ============================================================

alter table public.authors             enable row level security;
alter table public.media_files         enable row level security;
alter table public.article_tags        enable row level security;
alter table public.article_tag_links   enable row level security;
alter table public.article_relations   enable row level security;
alter table public.article_revisions   enable row level security;
alter table public.article_slug_history enable row level security;

-- ---------- helper: чи стаття публічно видима (без рекурсії у політиках) ----------
create or replace function public.is_article_public(p_article uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.articles a
    where a.id = p_article and a.deleted_at is null
      and a.status = 'published' and a.published_at is not null and a.published_at <= now()
  );
$$;
revoke all on function public.is_article_public(uuid) from public;
grant execute on function public.is_article_public(uuid) to anon, authenticated, service_role;

-- ---------- ARTICLES: публічне читання ----------
drop policy if exists "articles: read published" on public.articles;
drop policy if exists "articles: read public" on public.articles;
create policy "articles: read public" on public.articles
  for select using (
    public.is_admin()
    or (deleted_at is null and status = 'published' and published_at is not null and published_at <= now()
        and (access_level = 'public'
             or (access_level = 'authenticated' and auth.uid() is not null)))
  );
-- write лишається редакційним (editor); критичні поля захищає тригер нижче.

-- ---------- AUTHORS ----------
drop policy if exists "authors: read" on public.authors;
create policy "authors: read" on public.authors for select using (active or public.is_admin());
drop policy if exists "authors: editor write" on public.authors;
create policy "authors: editor write" on public.authors
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- MEDIA ----------
drop policy if exists "media: read" on public.media_files;
create policy "media: read" on public.media_files
  for select using (is_published or uploaded_by = auth.uid() or public.is_admin());
drop policy if exists "media: editor/own write" on public.media_files;
create policy "media: editor/own write" on public.media_files
  for all using (public.has_admin_role('editor') or uploaded_by = auth.uid())
  with check (public.has_admin_role('editor') or uploaded_by = auth.uid());

-- ---------- TAGS ----------
drop policy if exists "tags: read" on public.article_tags;
create policy "tags: read" on public.article_tags for select using (true);
drop policy if exists "tags: editor write" on public.article_tags;
create policy "tags: editor write" on public.article_tags
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

drop policy if exists "tag_links: read" on public.article_tag_links;
create policy "tag_links: read" on public.article_tag_links
  for select using (public.is_article_public(article_id) or public.is_admin());
drop policy if exists "tag_links: editor write" on public.article_tag_links;
create policy "tag_links: editor write" on public.article_tag_links
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- RELATIONS (тільки для опублікованих статей; deep-фільтрація — в API) ----------
drop policy if exists "relations: read" on public.article_relations;
create policy "relations: read" on public.article_relations
  for select using (public.is_article_public(article_id) or public.is_admin());
drop policy if exists "relations: editor write" on public.article_relations;
create policy "relations: editor write" on public.article_relations
  for all using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));

-- ---------- REVISIONS (приватні: лише адмін) ----------
drop policy if exists "revisions: admin read" on public.article_revisions;
create policy "revisions: admin read" on public.article_revisions
  for select using (public.is_admin());
-- запис — лише через SECURITY DEFINER RPC (немає insert-політики для клієнта).

-- ---------- SLUG HISTORY (публічне читання для редіректів) ----------
drop policy if exists "slug_history: read" on public.article_slug_history;
create policy "slug_history: read" on public.article_slug_history for select using (true);
-- запис — лише через RPC зміни slug.

-- ============================================================
-- Тригер-барʼєр критичних полів статті.
-- Дозволяємо змінювати status/published_at/... ЛИШЕ коли встановлено
-- app.privileged_write=1 (це роблять SECURITY DEFINER RPC у 018).
-- Прямий client update (навіть editor) не змінить системні поля.
-- ============================================================
create or replace function public.guard_articles_write()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare priv boolean := current_setting('app.privileged_write', true) = '1';
begin
  if priv then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'draft';
    new.published_at := null; new.scheduled_at := null; new.archived_at := null;
    new.featured := false; new.revision_number := 0;
    new.version := 1;
  else -- UPDATE: контент можна, системні поля — ні
    new.status := old.status;
    new.published_at := old.published_at;
    new.scheduled_at := old.scheduled_at;
    new.archived_at := old.archived_at;
    new.featured := old.featured;
    new.created_by := old.created_by;
    new.slug := old.slug;
    new.revision_number := old.revision_number;
    new.deleted_at := old.deleted_at;
    new.version := old.version + 1;   -- будь-яка зміна контенту підвищує version
  end if;
  return new;
end $$;
drop trigger if exists t_articles_guard on public.articles;
create trigger t_articles_guard before insert or update on public.articles
  for each row execute function public.guard_articles_write();

-- ============================================================
-- public_articles view (оновлений: slug, автор/категорія, published_at<=now)
-- ============================================================
drop view if exists public.public_articles;
create view public.public_articles as
  select
    a.id, a.slug, a.type, a.title, a.subtitle, a.excerpt,
    a.body, a.content_version, a.cover, a.cover_media_id,
    a.reading_time_minutes, a.featured, a.partner_material, a.access_level,
    a.language, a.views, a.saves, a.case_study_data,
    a.seo_title, a.seo_description, a.canonical_url,
    a.published_at, a.created_at, a.updated_at,
    a.author_id, au.name as author_name, au.slug as author_slug, au.avatar_media_id as author_avatar_id, au.headline as author_headline,
    a.category_id, c.title as category_title, c.slug as category_slug
  from public.articles a
  left join public.authors au on au.id = a.author_id
  left join public.article_categories c on c.id = a.category_id
  where a.deleted_at is null
    and a.status = 'published'
    and a.published_at is not null and a.published_at <= now();

grant select on public.public_articles to anon, authenticated;
