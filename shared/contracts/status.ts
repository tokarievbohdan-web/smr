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

// Типи матеріалів (дзеркало enum article_type) + єдині UA-мітки для UI.
// Єдине джерело — тут; mobile/web/admin не дублюють список.
export type ArticleType =
  | 'news' | 'case_study' | 'interview' | 'research' | 'insight'
  | 'opinion' | 'guide' | 'ranking' | 'partner_material';
export type ArticleStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
export type AccessLevel = 'public' | 'authenticated';

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  news: 'Новина', case_study: 'Кейс', interview: 'Інтервʼю', research: 'Дослідження',
  insight: 'Інсайт', opinion: 'Думка', guide: 'Гайд', ranking: 'Рейтинг',
  partner_material: 'Партнерський матеріал',
};
export function articleTypeLabel(t: string | null | undefined): string {
  return (t && ARTICLE_TYPE_LABELS[t as ArticleType]) || 'Матеріал';
}

export const MODERATION_PUBLIC: ModerationStatus = 'published';

/** Чи є контент публічно видимим (не враховуючи soft delete). */
export function isPubliclyVisible(status: ModerationStatus, deletedAt: string | null): boolean {
  return deletedAt == null && status === 'published';
}
