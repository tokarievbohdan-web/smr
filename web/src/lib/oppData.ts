import 'server-only';
import { DATA_MODE } from '@/server/env';
import { getOpportunityFeed, getOpportunityBySlug, type OppFeedParams } from '@/server/opportunities/queries';
import { OPPS, type Opportunity } from '@/lib/data';

const REMOTE: Record<string, string> = { onsite: 'Офлайн', remote: 'Дистанційно', hybrid: 'Гібридно', not_applicable: '—' };
export const remoteLabel = (r: string | null) => (r ? REMOTE[r] ?? r : '');

export function budgetLabel(r: Record<string, unknown>): string {
  if (r.budget_vis === 'public' && (r.budget_from || r.budget_to)) {
    const f = r.budget_from ? Number(r.budget_from).toLocaleString('uk-UA') : '';
    const t = r.budget_to ? Number(r.budget_to).toLocaleString('uk-UA') : '';
    return `${[f, t].filter(Boolean).join('–')} ${r.currency ?? ''}`.trim();
  }
  if (r.budget_vis === 'on_request') return 'Бюджет за запитом';
  return 'Бюджет не вказаний';
}

export interface OppCard {
  id: string; slug: string; title: string; shortDesc: string | null; typeTitle: string | null;
  orgName: string | null; orgSlug: string | null; orgVerified: boolean; city: string | null;
  remote: string; budget: string; deadline: string | null; applicationsCount: number;
}

const mapCard = (r: Record<string, unknown>): OppCard => ({
  id: r.id as string, slug: r.slug as string, title: r.title as string, shortDesc: (r.short_desc as string) ?? null,
  typeTitle: (r.type_title as string) ?? null, orgName: (r.org_name as string) ?? null, orgSlug: (r.org_slug as string) ?? null,
  orgVerified: !!r.org_verified, city: (r.city as string) ?? null, remote: remoteLabel(r.remote_mode as string),
  budget: budgetLabel(r), deadline: (r.application_deadline as string) ?? null, applicationsCount: Number(r.applications_count ?? 0),
});

const mockCard = (o: Opportunity): OppCard => ({
  id: o.id, slug: o.id, title: o.title, shortDesc: o.desc, typeTitle: o.type, orgName: o.org, orgSlug: null,
  orgVerified: !!o.verified, city: null, remote: '', budget: o.budget, deadline: o.deadline, applicationsCount: o.apps,
});

export async function listOpportunities(p: OppFeedParams): Promise<{ items: OppCard[]; total: number | null }> {
  if (DATA_MODE === 'supabase') {
    const f = await getOpportunityFeed(null, p);
    return { total: f.total, items: (f.items as unknown as Record<string, unknown>[]).map(mapCard) };
  }
  let items = OPPS.map(mockCard);
  if (p.type) items = items.filter((i) => (i.typeTitle ?? '').toLowerCase().includes(p.type as string));
  return { items, total: items.length };
}

export async function opportunityDetail(slug: string) {
  if (DATA_MODE === 'supabase') {
    const d = await getOpportunityBySlug(null, slug, null);
    if (!d) return null;
    const r = d as Record<string, unknown>;
    return {
      id: r.id as string, slug: r.slug as string, title: r.title as string, shortDesc: (r.short_desc as string) ?? null,
      fullDesc: (r.full_desc as string) ?? null, typeTitle: (r.type_title as string) ?? null,
      orgName: (r.org_name as string) ?? null, orgSlug: (r.org_slug as string) ?? null, orgVerified: !!r.org_verified,
      city: (r.city as string) ?? null, country: (r.country as string) ?? null, remote: remoteLabel(r.remote_mode as string),
      budget: budgetLabel(r), deadline: (r.application_deadline as string) ?? null, expiration: (r.expiration_date as string) ?? null,
      sports: (r.sports as string[]) ?? [], categories: (r.professional_categories as string[]) ?? [], tags: (r.tags as string[]) ?? [],
      expectedFormat: (r.expected_format as string) ?? null, applicationMethod: (r.application_method as string) ?? null,
      externalUrl: (r.external_application_url as string) ?? null, publishedAt: (r.published_at as string) ?? null,
      applicationsCount: Number(r.applications_count ?? 0),
    };
  }
  const o = OPPS.find((x) => x.id === slug);
  if (!o) return null;
  return {
    id: o.id, slug: o.id, title: o.title, shortDesc: o.desc, fullDesc: o.desc, typeTitle: o.type, orgName: o.org, orgSlug: null,
    orgVerified: !!o.verified, city: null, country: null, remote: '', budget: o.budget, deadline: o.deadline, expiration: null,
    sports: o.sport ? [o.sport] : [], categories: [], tags: [], expectedFormat: o.format, applicationMethod: 'internal',
    externalUrl: null, publishedAt: null, applicationsCount: o.apps,
  };
}
