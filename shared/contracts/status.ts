// Статуси — дзеркало enum-ів БД (міграція 001). Тримати синхронно.

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'blocked' | 'deleted';
export type ModerationStatus =
  | 'draft' | 'pending' | 'review' | 'changes' | 'published'
  | 'scheduled' | 'paused' | 'closed' | 'rejected' | 'expired' | 'archived';
export type ApplicationStatus =
  | 'new' | 'viewed' | 'shortlisted' | 'contacted' | 'accepted' | 'rejected' | 'withdrawn';
export type RegistrationStatus = 'registered' | 'waitlist' | 'cancelled' | 'attended' | 'noshow';
export type IntroStatus = 'new' | 'review' | 'moreinfo' | 'approved' | 'sent' | 'declined' | 'closed';
export type AdminRole =
  | 'super_admin' | 'editor' | 'moderator' | 'partnership_manager' | 'event_manager' | 'analyst';
export type AdminStatus = 'active' | 'suspended' | 'deleted';

export const MODERATION_PUBLIC: ModerationStatus = 'published';

/** Чи є контент публічно видимим (не враховуючи soft delete). */
export function isPubliclyVisible(status: ModerationStatus, deletedAt: string | null): boolean {
  return deletedAt == null && status === 'published';
}
