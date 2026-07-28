// Централізовані перетворення: database row (snake_case) ↔ domain model (camelCase).
// НЕ дублювати ці мапери в кожному застосунку — імпортувати звідси.
import type { UUID, ISODate, ISODateTime } from './ids';
import { toISODate, toISODateTime } from './ids';
import type {
  PublicProfile, PublicOrganization, Article, Opportunity, Event, Taxonomy, NotificationItem,
} from './entities';
import { validateArticleBody, emptyArticleBody } from './articleBody';

// ---------- generic key-case helpers ----------
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Глибоке перетворення ключів snake→camel (значення без змін). */
export function camelizeKeys<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) return input.map((v) => camelizeKeys(v)) as unknown as T;
  if (input && typeof input === 'object' && !(input instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) out[toCamel(k)] = camelizeKeys(v);
    return out as T;
  }
  return input as T;
}

/** Глибоке перетворення ключів camel→snake (для запису в БД/API). */
export function snakeizeKeys<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) return input.map((v) => snakeizeKeys(v)) as unknown as T;
  if (input && typeof input === 'object' && !(input instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) out[toSnake(k)] = snakeizeKeys(v);
    return out as T;
  }
  return input as T;
}

const asStrArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const asNum = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

type Row = Record<string, any>;

// ---------- typed row → domain ----------
export function rowToPublicProfile(r: Row): PublicProfile {
  return {
    id: r.id as UUID,
    displayName: r.display_name ?? null,
    avatar: r.avatar ?? null,
    headline: r.headline ?? null,
    position: r.position ?? null,
    organization: r.organization ?? null,
    bio: r.bio ?? null,
    city: r.city ?? null,
    country: r.country ?? null,
    userType: r.user_type ?? null,
    sports: asStrArr(r.sports),
    directions: asStrArr(r.directions),
    contentCategories: asStrArr(r.content_categories),
    availability: asStrArr(r.availability),
    skills: r.skills ?? null,
    socials: r.socials ?? null,
    portfolio: r.portfolio ?? null,
    verified: !!r.verified,
    contacts: r.contacts ?? null,
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
  };
}

export function rowToPublicOrganization(r: Row): PublicOrganization {
  return {
    id: r.id as UUID, name: r.name, type: r.type ?? null,
    city: r.city ?? null, region: r.region ?? null, country: r.country ?? null,
    shortDesc: r.short_desc ?? null, fullDesc: r.full_desc ?? null,
    website: r.website ?? null, logo: r.logo ?? null, cover: r.cover ?? null,
    founded: r.founded ?? null, audience: r.audience ?? null,
    socials: r.socials ?? null, contacts: r.contacts ?? null,
    services: asStrArr(r.services), directions: asStrArr(r.directions),
    partners: asStrArr(r.partners), sports: asStrArr(r.sports),
    portfolio: r.portfolio ?? null, verified: !!r.verified, featured: !!r.featured,
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
  };
}

export function rowToArticle(r: Row): Article {
  const parsed = validateArticleBody(r.body);
  return {
    id: r.id as UUID, type: r.type ?? null, category: r.category ?? null,
    title: r.title, subtitle: r.subtitle ?? null, excerpt: r.excerpt ?? null,
    body: parsed.ok ? parsed.doc : emptyArticleBody(),
    contentVersion: asNum(r.content_version) || 1,
    cover: r.cover ?? null, author: r.author ?? null,
    status: r.status, featured: !!r.featured, homeOrder: asNum(r.home_order),
    views: asNum(r.views), saves: asNum(r.saves), related: r.related ?? null, seo: r.seo ?? null,
    publishedAt: toISODateTime(r.published_at),
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
    updatedAt: (toISODateTime(r.updated_at) ?? '') as ISODateTime,
    deletedAt: toISODateTime(r.deleted_at),
  };
}

export function rowToOpportunity(r: Row): Opportunity {
  return {
    id: r.id as UUID, title: r.title, type: r.type ?? null, org: r.org ?? null,
    orgId: (r.org_id ?? null) as UUID | null, authorId: (r.author_id ?? null) as UUID | null,
    sport: r.sport ?? null, geography: r.geography ?? null, format: r.format ?? null,
    professionalCategory: r.professional_category ?? null,
    budgetVisibility: r.budget_visibility ?? null,
    budgetFrom: r.budget_from ?? null, budgetTo: r.budget_to ?? null,
    currency: r.currency ?? null, budget: r.budget ?? null,
    deadline: toISODate(r.deadline), expiresAt: toISODateTime(r.expires_at),
    publishedAt: toISODateTime(r.published_at),
    shortDesc: r.short_desc ?? null, fullDesc: r.full_desc ?? null,
    contactMethod: r.contact_method ?? null, externalLink: r.external_link ?? null,
    tags: asStrArr(r.tags), status: r.status, verified: !!r.verified, featured: !!r.featured,
    applicationsCount: asNum(r.applications_count),
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
    deletedAt: toISODateTime(r.deleted_at),
  };
}

export function rowToEvent(r: Row): Event {
  return {
    id: r.id as UUID, title: r.title, type: r.type ?? null, organizer: r.organizer ?? null,
    orgId: (r.org_id ?? null) as UUID | null,
    eventDate: toISODate(r.event_date), startTime: r.start_time ?? null, endTime: r.end_time ?? null,
    timezone: r.timezone ?? null, format: r.format ?? null, city: r.city ?? null, venue: r.venue ?? null,
    cost: r.cost ?? null, isPaid: !!r.is_paid, ticketUrl: r.ticket_url ?? null,
    seatsTotal: r.seats_total ?? null, seatsLeft: r.seats_left ?? null, regDeadline: toISODate(r.reg_deadline),
    shortDesc: r.short_desc ?? null, fullDesc: r.full_desc ?? null, cover: r.cover ?? null,
    speakers: r.speakers ?? null, partners: asStrArr(r.partners), tags: asStrArr(r.tags),
    status: r.status, featured: !!r.featured,
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
    deletedAt: toISODateTime(r.deleted_at),
  };
}

export function rowToTaxonomy(r: Row): Taxonomy {
  return { id: r.id as UUID, kind: r.kind, value: r.value, slug: r.slug ?? null, active: !!r.active, order: asNum(r.order) };
}

export function rowToNotification(r: Row): NotificationItem {
  return {
    id: r.id as UUID, userId: r.user_id as UUID, type: r.type, title: r.title ?? null, body: r.body ?? null,
    entityType: r.entity_type ?? null, entityId: r.entity_id ?? null, read: !!r.read,
    createdAt: (toISODateTime(r.created_at) ?? '') as ISODateTime,
  };
}
