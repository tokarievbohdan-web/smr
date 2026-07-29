import 'server-only';
import { DATA_MODE } from '@/server/env';
import { getProfileDirectory, getProfileById, getOrgDirectory, getOrgBySlug, type DirectoryParams } from '@/server/network/queries';
import { PEOPLE, ORGS, type Person, type Org } from '@/lib/data';

// Уніфікований web data-layer Network (Supabase у production, mock у dev).
export interface PersonCard {
  id: string; displayName: string; avatar: string | null; headline: string | null;
  city: string | null; verified: boolean; competencies: string[]; availability: string[];
}
export interface OrgCardT {
  id: string; slug: string; name: string; typeTitle: string | null;
  city: string | null; verified: boolean; sports: string[]; logo: string | null;
}

const AVAIL_LABEL: Record<string, string> = {
  open_to_work: 'Відкритий до роботи', open_to_projects: 'Відкритий до проєктів',
  looking_for_partners: 'Шукаю партнерів', looking_for_investment: 'Шукаю інвестиції',
  available_as_speaker: 'Готовий бути спікером', not_looking: 'Не розглядаю пропозиції',
};
const availLabel = (a: string) => AVAIL_LABEL[a] ?? a;

const mockPerson = (p: Person): PersonCard => ({
  id: p.id, displayName: p.name, avatar: null, headline: p.role, city: null,
  verified: !!p.verified, competencies: p.competencies, availability: p.availability,
});
const mockOrg = (o: Org): OrgCardT => ({
  id: o.id, slug: o.id, name: o.name, typeTitle: o.type, city: o.city, verified: !!o.verified, sports: o.sports, logo: null,
});

export async function peopleDirectory(p: DirectoryParams): Promise<{ items: PersonCard[]; total: number | null }> {
  if (DATA_MODE === 'supabase') {
    const r = await getProfileDirectory(null, p);
    return {
      total: r.total,
      items: (r.items as Record<string, unknown>[]).map((x) => ({
        id: x.id as string, displayName: (x.display_name as string) ?? '—', avatar: (x.avatar as string) ?? null,
        headline: (x.headline as string) ?? (x.current_position as string) ?? null, city: (x.city as string) ?? null,
        verified: !!x.verified, competencies: (x.professional_categories as string[]) ?? [],
        availability: ((x.availability_statuses as string[]) ?? []).map(availLabel),
      })),
    };
  }
  let items = PEOPLE.map(mockPerson);
  if (p.verified) items = items.filter((i) => i.verified);
  return { items, total: items.length };
}

export async function orgDirectory(p: DirectoryParams): Promise<{ items: OrgCardT[]; total: number | null }> {
  if (DATA_MODE === 'supabase') {
    const r = await getOrgDirectory(null, p);
    return {
      total: r.total,
      items: (r.items as Record<string, unknown>[]).map((x) => ({
        id: x.id as string, slug: (x.slug as string) ?? (x.id as string), name: x.name as string,
        typeTitle: (x.type_title as string) ?? null, city: (x.city as string) ?? null,
        verified: !!x.verified, sports: (x.sports as string[]) ?? [], logo: (x.logo as string) ?? null,
      })),
    };
  }
  let items = ORGS.map(mockOrg);
  if (p.verified) items = items.filter((i) => i.verified);
  return { items, total: items.length };
}

export async function personDetail(id: string) {
  if (DATA_MODE === 'supabase') {
    const d = await getProfileById(null, id);
    if (!d) return null;
    const x = d as Record<string, unknown>;
    return {
      id: x.id as string, displayName: (x.display_name as string) ?? '—', avatar: (x.avatar as string) ?? null,
      headline: (x.headline as string) ?? null, currentPosition: (x.current_position as string) ?? null,
      city: (x.city as string) ?? null, region: (x.region as string) ?? null, country: (x.country as string) ?? null,
      bio: (x.bio as string) ?? null, verified: !!x.verified,
      sports: (x.sports as string[]) ?? [], categories: (x.professional_categories as string[]) ?? [],
      skills: (x.skills as string[]) ?? [], availability: ((x.availability_statuses as string[]) ?? []).map(availLabel),
      publicEmail: (x.public_email as string) ?? null, website: (x.website as string) ?? null, linkedin: (x.linkedin_url as string) ?? null,
      experience: (x.experience as unknown[]) ?? [], projects: (x.projects as unknown[]) ?? [], portfolio: (x.portfolio as unknown[]) ?? [],
    };
  }
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) return null;
  return {
    id: p.id, displayName: p.name, avatar: null, headline: p.role, currentPosition: null,
    city: null, region: null, country: null, bio: null, verified: !!p.verified,
    sports: [], categories: p.competencies, skills: p.competencies, availability: p.availability,
    publicEmail: null, website: null, linkedin: null, experience: [], projects: [], portfolio: [],
  };
}

export async function orgDetail(slug: string) {
  if (DATA_MODE === 'supabase') {
    const d = await getOrgBySlug(null, slug);
    if (!d) return null;
    const x = d as Record<string, unknown>;
    return {
      id: x.id as string, slug: x.slug as string, name: x.name as string, typeTitle: (x.type_title as string) ?? null,
      city: (x.city as string) ?? null, region: (x.region as string) ?? null, country: (x.country as string) ?? null,
      shortDesc: (x.short_desc as string) ?? null, fullDesc: (x.full_desc as string) ?? null,
      website: (x.website as string) ?? null, logo: (x.logo as string) ?? null, cover: (x.cover as string) ?? null,
      verified: !!x.verified, sports: (x.sports as string[]) ?? [], services: (x.services as string[]) ?? [],
      commercialDirections: (x.commercial_directions as string[]) ?? [], partners: (x.partners as string[]) ?? [],
      publicEmail: (x.public_email as string) ?? null, publicPhone: (x.public_phone as string) ?? null,
      team: (x.team as unknown[]) ?? [],
    };
  }
  const o = ORGS.find((x) => x.id === slug);
  if (!o) return null;
  return {
    id: o.id, slug: o.id, name: o.name, typeTitle: o.type, city: o.city, region: null, country: null,
    shortDesc: null, fullDesc: null, website: null, logo: null, cover: null, verified: !!o.verified,
    sports: o.sports, services: [], commercialDirections: [], partners: [], publicEmail: null, publicPhone: null, team: [],
  };
}
