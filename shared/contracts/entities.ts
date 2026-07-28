// Доменні моделі (camelCase). Дзеркалять таблиці БД (snake_case) — перетворення
// централізовано у mappers.ts. UI НЕ читає рядки БД напряму, лише ці типи.
import type { UUID, ISODate, ISODateTime } from './ids';
import type {
  AccountStatus, ModerationStatus, ApplicationStatus, RegistrationStatus, IntroStatus, AdminRole,
} from './status';
import type { ArticleBodyDocument } from './articleBody';

export interface Taxonomy {
  id: UUID; kind: string; value: string; slug: string | null; active: boolean; order: number;
}

/** Публічний профіль (з public_profiles) — БЕЗ email/приватних полів. */
export interface PublicProfile {
  id: UUID;
  displayName: string | null;
  avatar: string | null;
  headline: string | null;
  position: string | null;
  organization: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  userType: string | null;
  sports: string[];
  directions: string[];
  contentCategories: string[];
  availability: string[];
  skills: unknown;
  socials: unknown;
  portfolio: unknown;
  verified: boolean;
  contacts: unknown | null;   // лише якщо користувач зробив публічними
  createdAt: ISODateTime;
}

/** Повний профіль (лише власник/адмін). */
export interface Profile extends Omit<PublicProfile, 'contacts'> {
  email: string;
  status: AccountStatus;
  emailConfirmed: boolean;
  goals: string[];
  settings: Record<string, unknown>;
  onboardingStep: number;
  deletedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface PublicOrganization {
  id: UUID; name: string; type: string | null;
  city: string | null; region: string | null; country: string | null;
  shortDesc: string | null; fullDesc: string | null;
  website: string | null; logo: string | null; cover: string | null;
  founded: string | null; audience: string | null;
  socials: unknown; contacts: unknown;
  services: string[]; directions: string[]; partners: string[]; sports: string[];
  portfolio: unknown; verified: boolean; featured: boolean; createdAt: ISODateTime;
}

export interface Article {
  id: UUID; type: string | null; category: string | null;
  title: string; subtitle: string | null; excerpt: string | null;
  body: ArticleBodyDocument; contentVersion: number;
  cover: string | null; author: unknown;
  status: ModerationStatus; featured: boolean; homeOrder: number;
  views: number; saves: number; related: unknown; seo: unknown;
  publishedAt: ISODateTime | null; createdAt: ISODateTime; updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
}

export interface Opportunity {
  id: UUID; title: string; type: string | null; org: string | null; orgId: UUID | null;
  authorId: UUID | null; sport: string | null; geography: string | null;
  format: string | null; professionalCategory: string | null;
  budgetVisibility: string | null; budgetFrom: number | null; budgetTo: number | null;
  currency: string | null; budget: string | null;
  deadline: ISODate | null; expiresAt: ISODateTime | null; publishedAt: ISODateTime | null;
  shortDesc: string | null; fullDesc: string | null;
  contactMethod: string | null; externalLink: string | null; tags: string[];
  status: ModerationStatus; verified: boolean; featured: boolean;
  applicationsCount: number; createdAt: ISODateTime; deletedAt: ISODateTime | null;
}

export interface Event {
  id: UUID; title: string; type: string | null; organizer: string | null; orgId: UUID | null;
  eventDate: ISODate | null; startTime: string | null; endTime: string | null; timezone: string | null;
  format: string | null; city: string | null; venue: string | null;
  cost: string | null; isPaid: boolean; ticketUrl: string | null;
  seatsTotal: number | null; seatsLeft: number | null; regDeadline: ISODate | null;
  shortDesc: string | null; fullDesc: string | null; cover: string | null;
  speakers: unknown; partners: string[]; tags: string[];
  status: ModerationStatus; featured: boolean; createdAt: ISODateTime; deletedAt: ISODateTime | null;
}

export interface Introduction {
  id: UUID; requesterId: UUID | null; targetType: string | null; targetId: string | null;
  targetName: string | null; targetRole: string | null;
  reason: string | null; context: string | null; expectedResult: string | null;
  consent: boolean; status: IntroStatus; priority: string | null;
  createdAt: ISODateTime; updatedAt: ISODateTime;
}

export interface NotificationItem {
  id: UUID; userId: UUID; type: string; title: string | null; body: string | null;
  entityType: string | null; entityId: string | null; read: boolean; createdAt: ISODateTime;
}

export interface Application {
  id: UUID; oppId: UUID; userId: UUID; message: string | null; portfolio: string | null;
  attachment: string | null; status: ApplicationStatus; note: string | null; createdAt: ISODateTime;
}

export interface EventRegistration {
  id: UUID; eventId: UUID; userId: UUID; status: RegistrationStatus; createdAt: ISODateTime;
}

export interface AdminUser {
  id: UUID; email: string; name: string | null; role: AdminRole; status: string; createdAt: ISODateTime;
}
