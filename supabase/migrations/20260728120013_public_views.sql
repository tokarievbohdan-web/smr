-- ============================================================
-- 013 · Public views (безпечна публічна вибірка)
-- Views належать привілейованій ролі міграції → читають базові таблиці в
-- обхід RLS і віддають ЛИШЕ дозволені колонки опублікованих, не видалених
-- записів. Клієнту дається select лише на views; update базових таблиць
-- через view неможливий (granted only SELECT).
-- Примітка: це навмисні "definer" views; linter-попередження очікуване.
-- ============================================================

-- ---------- PUBLIC PROFILES (без email/phone/settings/admin_notes) ----------
create or replace view public.public_profiles as
  select
    p.id,
    coalesce(p.profile->>'displayName',
             nullif(trim(concat_ws(' ', p.profile->>'firstName', p.profile->>'lastName')), '')) as display_name,
    p.profile->>'photo'    as avatar,
    p.profile->>'headline' as headline,
    p.profile->>'position' as position,
    p.profile->>'org'      as organization,
    p.profile->>'bio'      as bio,
    p.profile->>'city'     as city,
    p.profile->>'country'  as country,
    p.user_type,
    p.sports,
    p.directions,
    p.content_categories,
    p.availability,
    p.profile->'skills'    as skills,
    p.profile->'socials'   as socials,
    p.profile->'portfolio' as portfolio,
    p.verified,
    -- Контакти віддаємо лише за явним рішенням користувача (contactsPublic).
    case when coalesce((p.settings->>'contactsPublic')::boolean, false)
         then p.profile->'contacts' else null end as contacts,
    p.created_at
  from public.profiles p
  where p.deleted_at is null
    and p.status = 'active'
    and coalesce((p.settings->>'privacyPublic')::boolean, true);

-- ---------- PUBLIC ORGANIZATIONS ----------
create or replace view public.public_organizations as
  select
    o.id, o.name, o.type, o.city, o.region, o.country,
    o.short_desc, o.full_desc, o.website, o.logo, o.cover, o.founded, o.audience,
    o.socials, o.contacts, o.services, o.directions, o.partners, o.sports, o.portfolio,
    o.verified, o.featured, o.created_at
  from public.organizations o
  where o.deleted_at is null
    and (o.status = 'published' or o.verified);

-- ---------- PUBLIC ARTICLES ----------
-- drop перед create: у 017 view розширюється колонками, тож re-apply із
-- create-or-replace старої форми впав би ("cannot drop columns from view").
drop view if exists public.public_articles;
create view public.public_articles as
  select
    a.id, a.type, a.category, a.title, a.subtitle, a.excerpt,
    a.body, a.content_version, a.cover, a.author,
    a.featured, a.home_order, a.views, a.saves, a.related, a.seo,
    a.published_at, a.created_at
  from public.articles a
  where a.deleted_at is null
    and a.status = 'published';

-- ---------- PUBLIC OPPORTUNITIES (бюджет — лише коли public) ----------
create or replace view public.public_opportunities as
  select
    op.id, op.title, op.type, op.org, op.org_id, op.sport, op.geography,
    op.format, op.professional_category,
    op.budget_visibility,
    case when op.budget_visibility = 'public' then op.budget_from end as budget_from,
    case when op.budget_visibility = 'public' then op.budget_to   end as budget_to,
    case when op.budget_visibility = 'public' then op.currency    end as currency,
    case when op.budget_visibility = 'public' then op.budget      end as budget,
    op.deadline, op.expires_at, op.published_at,
    op.short_desc, op.full_desc, op.contact_method, op.external_link, op.tags,
    op.featured, op.applications_count, op.created_at
  from public.opportunities op
  where op.deleted_at is null
    and op.status = 'published';

-- ---------- PUBLIC EVENTS ----------
create or replace view public.public_events as
  select
    e.id, e.title, e.type, e.organizer, e.org_id,
    e.event_date, e.start_time, e.end_time, e.timezone,
    e.format, e.city, e.venue, e.cost, e.is_paid, e.ticket_url,
    e.seats_total, e.seats_left, e.reg_deadline,
    e.short_desc, e.full_desc, e.cover, e.speakers, e.partners, e.tags,
    e.featured, e.created_at
  from public.events e
  where e.deleted_at is null
    and e.status = 'published';

-- ---------- grants: лише SELECT анону та авторизованим ----------
grant select on public.public_profiles      to anon, authenticated;
grant select on public.public_organizations to anon, authenticated;
grant select on public.public_articles      to anon, authenticated;
grant select on public.public_opportunities to anon, authenticated;
grant select on public.public_events        to anon, authenticated;
