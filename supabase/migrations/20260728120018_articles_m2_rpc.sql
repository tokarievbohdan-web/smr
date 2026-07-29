-- ============================================================
-- 018 · Milestone 2 — Articles: атомарні RPC редакційного циклу
-- Усі — SECURITY DEFINER + fixed search_path + перевірка ролі в БД.
-- Встановлюють app.privileged_write=1, тож тригер-барʼєр (017) пропускає
-- зміну системних полів. Ролі editor+ (super_admin проходить завжди).
-- ============================================================

-- ---------- slugify (зберігає кирилицю; для ручного override — окремо) ----------
create or replace function public.slugify(t text)
returns text language sql immutable set search_path = public as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(t,'')), '[^a-z0-9а-яіїєґ]+', '-', 'g')), '');
$$;

-- ---------- унікальний slug ----------
create or replace function public._unique_slug(p_base text, p_article uuid)
returns text language plpgsql set search_path = public as $$
declare s text := coalesce(public.slugify(p_base), 'article'); c text := s; i int := 2;
begin
  while exists (select 1 from public.articles where slug = c and deleted_at is null and (p_article is null or id <> p_article)) loop
    c := s || '-' || i; i := i + 1;
  end loop;
  return c;
end $$;

-- ---------- snapshot статті (для revision) ----------
create or replace function public._article_snapshot(p_id uuid)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'title', a.title, 'subtitle', a.subtitle, 'excerpt', a.excerpt, 'body', a.body,
    'type', a.type, 'category_id', a.category_id, 'author_id', a.author_id,
    'seo', jsonb_build_object('title', a.seo_title, 'description', a.seo_description),
    'case_study_data', a.case_study_data, 'access_level', a.access_level,
    'cover_media_id', a.cover_media_id, 'status', a.status,
    'tags', coalesce((select jsonb_agg(tag_id) from public.article_tag_links where article_id = a.id), '[]'::jsonb),
    'relations', coalesce((select jsonb_agg(jsonb_build_object('type', related_entity_type, 'id', related_entity_id, 'rel', relation_type))
                            from public.article_relations where article_id = a.id), '[]'::jsonb)
  ) from public.articles a where a.id = p_id;
$$;

-- ---------- створити revision ----------
create or replace function public._create_revision(p_id uuid, p_reason text, p_actor uuid)
returns int language plpgsql set search_path = public as $$
declare n int;
begin
  select coalesce(max(revision_number), 0) + 1 into n from public.article_revisions where article_id = p_id;
  insert into public.article_revisions(article_id, revision_number, snapshot, created_by, reason)
    values (p_id, n, public._article_snapshot(p_id), p_actor, p_reason);
  update public.articles set revision_number = n where id = p_id;  -- через privileged flag (виклик усередині RPC)
  return n;
end $$;

-- ---------- audit helper ----------
create or replace function public._article_audit(p_actor uuid, p_action text, p_id uuid, p_old jsonb, p_new jsonb, p_req text)
returns void language sql set search_path = public as $$
  insert into public.audit_log(actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, request_id)
  values (p_actor, public.current_admin_role()::text, p_action, 'article', p_id::text, p_old, p_new, p_req);
$$;

-- ============================================================
-- CREATE DRAFT
-- ============================================================
create or replace function public.create_article_draft(p_patch jsonb, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_actor uuid := auth.uid(); v_slug text;
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  perform set_config('app.privileged_write', '1', true);
  v_id := gen_random_uuid();
  v_slug := public._unique_slug(coalesce(p_patch->>'slug', p_patch->>'title', 'article'), v_id);
  insert into public.articles(id, slug, title, subtitle, excerpt, body, type, category_id, author_id,
      seo_title, seo_description, access_level, language, case_study_data, status, created_by, updated_by)
  values (v_id, v_slug,
      coalesce(p_patch->>'title',''), p_patch->>'subtitle', p_patch->>'excerpt',
      coalesce(p_patch->'body', '{"version":1,"blocks":[]}'::jsonb),
      coalesce((p_patch->>'type')::article_type, 'news'),
      nullif(p_patch->>'category_id','')::uuid, nullif(p_patch->>'author_id','')::uuid,
      p_patch->>'seo_title', p_patch->>'seo_description',
      coalesce((p_patch->>'access_level')::access_level, 'public'),
      coalesce(p_patch->>'language','uk'), p_patch->'case_study_data', 'draft', v_actor, v_actor);
  perform public._article_audit(v_actor, 'article_created', v_id, null, jsonb_build_object('slug', v_slug), p_request_id);
  return jsonb_build_object('ok', true, 'id', v_id, 'slug', v_slug, 'status', 'draft', 'version', 1);
end $$;

-- ============================================================
-- UPDATE DRAFT (optimistic concurrency)
-- ============================================================
create or replace function public.update_article_draft(p_id uuid, p_patch jsonb, p_expected_version int default null, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ver int; v_status article_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select version, status into v_ver, v_status from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_status not in ('draft','in_review') then
    raise exception 'invalid_status_transition: editable only in draft/in_review' using errcode = 'P0001';
  end if;
  if p_expected_version is not null and p_expected_version <> v_ver then
    raise exception 'version_conflict' using errcode = '40001', detail = v_ver::text;
  end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set
    title = coalesce(p_patch->>'title', title),
    subtitle = coalesce(p_patch->>'subtitle', subtitle),
    excerpt = coalesce(p_patch->>'excerpt', excerpt),
    body = coalesce(p_patch->'body', body),
    type = case when p_patch ? 'type' then (p_patch->>'type')::article_type else type end,
    category_id = coalesce(nullif(p_patch->>'category_id','')::uuid, category_id),
    author_id = coalesce(nullif(p_patch->>'author_id','')::uuid, author_id),
    cover = coalesce(p_patch->>'cover', cover),
    cover_media_id = coalesce(nullif(p_patch->>'cover_media_id','')::uuid, cover_media_id),
    seo_title = coalesce(p_patch->>'seo_title', seo_title),
    seo_description = coalesce(p_patch->>'seo_description', seo_description),
    access_level = case when p_patch ? 'access_level' then (p_patch->>'access_level')::access_level else access_level end,
    reading_time_minutes = coalesce((p_patch->>'reading_time_minutes')::int, reading_time_minutes),
    case_study_data = coalesce(p_patch->'case_study_data', case_study_data),
    partner_material = coalesce((p_patch->>'partner_material')::boolean, partner_material),
    canonical_url = coalesce(p_patch->>'canonical_url', canonical_url),
    editorial_note = coalesce(p_patch->>'editorial_note', editorial_note),
    version = v_ver + 1, updated_by = v_actor, updated_at = now()
  where id = p_id;
  -- tag_ids (масив uuid) — повна заміна звʼязків, якщо передано
  if p_patch ? 'tag_ids' then
    delete from public.article_tag_links where article_id = p_id;
    insert into public.article_tag_links(article_id, tag_id)
      select p_id, (t)::uuid from jsonb_array_elements_text(p_patch->'tag_ids') t
      on conflict do nothing;
  end if;
  perform public._article_audit(v_actor, 'article_updated', p_id, jsonb_build_object('version', v_ver), jsonb_build_object('version', v_ver + 1), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'version', v_ver + 1);
end $$;

-- ============================================================
-- SUBMIT / RETURN / SCHEDULE / PUBLISH / ARCHIVE / RESTORE / SLUG
-- ============================================================
create or replace function public.submit_article_for_review(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status article_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select status into v_status from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_status <> 'draft' then raise exception 'invalid_status_transition' using errcode = 'P0001'; end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set status = 'in_review', updated_by = v_actor where id = p_id;
  perform public._create_revision(p_id, 'submit_for_review', v_actor);
  perform public._article_audit(v_actor, 'article_submitted', p_id, jsonb_build_object('status','draft'), jsonb_build_object('status','in_review'), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'status', 'in_review');
end $$;

create or replace function public.return_article_to_draft(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status article_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select status into v_status from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_status not in ('in_review','scheduled') then raise exception 'invalid_status_transition' using errcode = 'P0001'; end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set status = 'draft', scheduled_at = null, updated_by = v_actor where id = p_id;
  perform public._article_audit(v_actor, 'article_returned_to_draft', p_id, jsonb_build_object('status',v_status), jsonb_build_object('status','draft'), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'status', 'draft');
end $$;

create or replace function public.schedule_article(p_id uuid, p_when timestamptz, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status article_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_when is null or p_when <= now() then raise exception 'scheduled_date_in_past' using errcode = 'P0001'; end if;
  select status into v_status from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_status not in ('in_review','draft') then raise exception 'invalid_status_transition' using errcode = 'P0001'; end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set status = 'scheduled', scheduled_at = p_when, updated_by = v_actor where id = p_id;
  perform public._create_revision(p_id, 'schedule', v_actor);
  perform public._article_audit(v_actor, 'article_scheduled', p_id, jsonb_build_object('status',v_status), jsonb_build_object('status','scheduled','scheduled_at',p_when), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'status', 'scheduled', 'scheduled_at', p_when);
end $$;

-- Публікація: валідація обовʼязкових полів + body + slug, атомарно + revision + audit.
create or replace function public.publish_article(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.articles; v_actor uuid := auth.uid(); v_slug text;
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into a from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if a.status not in ('in_review','scheduled','draft') then raise exception 'invalid_status_transition' using errcode = 'P0001'; end if;
  -- обовʼязкові поля
  if coalesce(trim(a.title),'') = '' then raise exception 'validation: title required' using errcode = 'P0001'; end if;
  if a.author_id is null then raise exception 'validation: author required' using errcode = 'P0001'; end if;
  if a.category_id is null then raise exception 'validation: category required' using errcode = 'P0001'; end if;
  -- body: обʼєкт з масивом blocks і хоча б одним блоком
  if jsonb_typeof(a.body) <> 'object' or jsonb_typeof(a.body->'blocks') <> 'array'
     or jsonb_array_length(a.body->'blocks') = 0 then
    raise exception 'invalid_body' using errcode = 'P0001';
  end if;
  v_slug := coalesce(a.slug, public._unique_slug(a.title, p_id));
  perform set_config('app.privileged_write', '1', true);
  update public.articles set status = 'published', slug = v_slug,
      published_at = now(), scheduled_at = null, updated_by = v_actor where id = p_id;
  perform public._create_revision(p_id, 'publish', v_actor);
  perform public._article_audit(v_actor, 'article_published', p_id, jsonb_build_object('status',a.status), jsonb_build_object('status','published'), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'slug', v_slug, 'status', 'published');
end $$;

create or replace function public.archive_article(p_id uuid, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status article_status; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select status into v_status from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_status <> 'published' then raise exception 'invalid_status_transition' using errcode = 'P0001'; end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set status = 'archived', archived_at = now(), updated_by = v_actor where id = p_id;
  perform public._article_audit(v_actor, 'article_archived', p_id, jsonb_build_object('status','published'), jsonb_build_object('status','archived'), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'status', 'archived');
end $$;

-- Відновлення revision у НОВИЙ draft (не перезаписує опубліковане мовчки).
create or replace function public.restore_article_revision(p_id uuid, p_revision int, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare snap jsonb; v_actor uuid := auth.uid(); v_ver int;
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select snapshot into snap from public.article_revisions where article_id = p_id and revision_number = p_revision;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  select version into v_ver from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform set_config('app.privileged_write', '1', true);
  update public.articles set
    title = coalesce(snap->>'title', title), subtitle = snap->>'subtitle', excerpt = snap->>'excerpt',
    body = coalesce(snap->'body', body), type = coalesce((snap->>'type')::article_type, type),
    category_id = nullif(snap->>'category_id','')::uuid, author_id = nullif(snap->>'author_id','')::uuid,
    case_study_data = snap->'case_study_data',
    status = 'draft', published_at = null, scheduled_at = null,
    version = v_ver + 1, updated_by = v_actor, updated_at = now()
  where id = p_id;
  perform public._article_audit(v_actor, 'article_revision_restored', p_id, jsonb_build_object('restored_from', p_revision), jsonb_build_object('status','draft'), p_request_id);
  return jsonb_build_object('ok', true, 'id', p_id, 'status', 'draft', 'restored_from', p_revision);
end $$;

-- Зміна slug опублікованого матеріалу зі збереженням редіректу.
create or replace function public.change_published_slug(p_id uuid, p_new_slug text, p_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_old text; v_new text; v_actor uuid := auth.uid();
begin
  if not public.has_admin_role('editor') then raise exception 'forbidden' using errcode = '42501'; end if;
  select slug into v_old from public.articles where id = p_id and deleted_at is null for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  v_new := public._unique_slug(p_new_slug, p_id);
  if v_new = v_old then return jsonb_build_object('ok', true, 'slug', v_old, 'unchanged', true); end if;
  perform set_config('app.privileged_write', '1', true);
  insert into public.article_slug_history(article_id, old_slug) values (p_id, v_old) on conflict (old_slug) do nothing;
  update public.articles set slug = v_new, updated_by = v_actor where id = p_id;
  perform public._article_audit(v_actor, 'article_slug_changed', p_id, jsonb_build_object('slug', v_old), jsonb_build_object('slug', v_new), p_request_id);
  return jsonb_build_object('ok', true, 'slug', v_new, 'old_slug', v_old);
end $$;

-- ============================================================
-- CRON: публікація запланованих (ідемпотентно). Лише service_role.
-- ============================================================
create or replace function public.publish_due_scheduled()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; cnt int := 0;
begin
  perform set_config('app.privileged_write', '1', true);
  for r in select id from public.articles
           where status = 'scheduled' and deleted_at is null
             and scheduled_at is not null and scheduled_at <= now()
           for update skip locked loop
    update public.articles set status = 'published', published_at = coalesce(scheduled_at, now()), scheduled_at = null where id = r.id;
    perform public._create_revision(r.id, 'scheduled_publish', null);
    perform public._article_audit(null, 'article_published_scheduled', r.id, jsonb_build_object('status','scheduled'), jsonb_build_object('status','published'), 'cron');
    cnt := cnt + 1;
  end loop;
  return jsonb_build_object('ok', true, 'published', cnt);
end $$;

-- ---------- grants ----------
do $$ declare fn text; begin
  for fn in select unnest(array[
    'create_article_draft(jsonb,text)','update_article_draft(uuid,jsonb,integer,text)',
    'submit_article_for_review(uuid,text)','return_article_to_draft(uuid,text)',
    'schedule_article(uuid,timestamptz,text)','publish_article(uuid,text)','archive_article(uuid,text)',
    'restore_article_revision(uuid,integer,text)','change_published_slug(uuid,text,text)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
-- cron-функція — лише service_role (сервер), не клієнт.
revoke all on function public.publish_due_scheduled() from public, anon, authenticated;
grant execute on function public.publish_due_scheduled() to service_role;
