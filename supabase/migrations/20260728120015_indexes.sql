-- ============================================================
-- 015 · Indexes (продуктивність публічних вибірок і зв'язків)
-- Часткові індекси на "живий" контент (deleted_at is null).
-- ============================================================

create index if not exists idx_profiles_status        on public.profiles (status) where deleted_at is null;

create index if not exists idx_orgs_public             on public.organizations (status, verified) where deleted_at is null;
create index if not exists idx_orgs_owner              on public.organizations (owner_id);

create index if not exists idx_articles_published      on public.articles (published_at desc) where deleted_at is null and status = 'published';
create index if not exists idx_articles_featured       on public.articles (featured) where deleted_at is null and status = 'published';
create index if not exists idx_articles_category       on public.articles (category) where deleted_at is null and status = 'published';

create index if not exists idx_opps_published          on public.opportunities (status, deadline) where deleted_at is null;
create index if not exists idx_opps_author             on public.opportunities (author_id);
create index if not exists idx_applications_opp        on public.applications (opp_id);
create index if not exists idx_applications_user       on public.applications (user_id);

create index if not exists idx_events_published        on public.events (status, event_date) where deleted_at is null;
create index if not exists idx_event_regs_event        on public.event_registrations (event_id);
create index if not exists idx_event_regs_user         on public.event_registrations (user_id);

create index if not exists idx_intros_requester        on public.introductions (requester_id, status) where deleted_at is null;
create index if not exists idx_notifications_user      on public.notifications (user_id, read) where deleted_at is null;
create index if not exists idx_bookmarks_user          on public.bookmarks (user_id);
create index if not exists idx_taxonomies_kind         on public.taxonomies (kind, "order") where active;

create index if not exists idx_audit_entity            on public.audit_log (entity_type, entity_id);
create index if not exists idx_audit_actor             on public.audit_log (actor_user_id, created_at desc);
create index if not exists idx_analytics_event         on public.analytics_events (event, created_at desc);
