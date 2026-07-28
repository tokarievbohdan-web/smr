import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In-app сповіщення (swap → Supabase realtime / push).
 * Push-архітектура: expo-notifications можна підключити пізніше —
 * registerForPush() нижче є заглушкою, push не обовʼязковий для MVP.
 */

export type NotifType =
  | 'opportunity_approved' | 'opportunity_rejected' | 'changes_requested'
  | 'new_application' | 'application_viewed' | 'application_status'
  | 'event_registration' | 'event_reminder' | 'event_cancelled' | 'event_rescheduled'
  | 'intro_status' | 'org_access' | 'verification' | 'admin_message';

export type EntityType = 'opportunity' | 'event' | 'article' | 'intro' | 'organization';

export interface Notification {
  id: string; type: NotifType; title: string; body: string;
  entityType?: EntityType; entityId?: string;
  read: boolean; at: number;
}

export const NOTIF_META: Record<NotifType, { label: string; icon: string; group: string }> = {
  opportunity_approved: { label: 'Можливість схвалено', icon: 'checkmark-circle-outline', group: 'Можливості' },
  opportunity_rejected: { label: 'Можливість відхилено', icon: 'close-circle-outline', group: 'Можливості' },
  changes_requested: { label: 'Потрібні правки', icon: 'create-outline', group: 'Можливості' },
  new_application: { label: 'Новий відгук', icon: 'person-add-outline', group: 'Відгуки' },
  application_viewed: { label: 'Відгук переглянуто', icon: 'eye-outline', group: 'Відгуки' },
  application_status: { label: 'Статус відгуку', icon: 'flag-outline', group: 'Відгуки' },
  event_registration: { label: 'Реєстрацію підтверджено', icon: 'calendar-outline', group: 'Події' },
  event_reminder: { label: 'Нагадування про подію', icon: 'alarm-outline', group: 'Події' },
  event_cancelled: { label: 'Подію скасовано', icon: 'close-circle-outline', group: 'Події' },
  event_rescheduled: { label: 'Подію перенесено', icon: 'time-outline', group: 'Події' },
  intro_status: { label: 'Статус знайомства', icon: 'people-outline', group: 'Знайомства' },
  org_access: { label: 'Доступ до організації', icon: 'shield-checkmark-outline', group: 'Організації' },
  verification: { label: 'Верифікація', icon: 'ribbon-outline', group: 'Акаунт' },
  admin_message: { label: 'Повідомлення команди', icon: 'megaphone-outline', group: 'Акаунт' },
};

export type Preferences = Record<string, boolean>;

interface Store { items: Notification[]; prefs: Preferences; seeded?: boolean }
const KEY = 'smr_notifications_v1';
const empty: Store = { items: [], prefs: {} };

const load = async (): Promise<Store> => {
  try { return { ...empty, ...JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') }; }
  catch { return { ...empty }; }
};
const save = (s: Store) => AsyncStorage.setItem(KEY, JSON.stringify(s));

function demo(): Notification[] {
  const now = Date.now(); const h = 3600000; const d = 86400000;
  return [
    { id: 'n1', type: 'new_application', title: 'Новий відгук на «Head of Sponsorship»', body: 'Данило Бондар надіслав відгук.', entityType: 'opportunity', entityId: 'op1', read: false, at: now - h * 2 },
    { id: 'n2', type: 'intro_status', title: 'Потрібно більше інформації', body: 'Команда SMR попросила уточнення щодо знайомства з УАФ.', entityType: 'intro', read: false, at: now - h * 5 },
    { id: 'n3', type: 'event_registration', title: 'Реєстрацію підтверджено', body: 'Sport Business Forum Ukraine 2026 — 12 вересня.', entityType: 'event', entityId: 'e1', read: false, at: now - h * 8 },
    { id: 'n4', type: 'opportunity_approved', title: 'Можливість опубліковано', body: '«Спонсорський пакет жіночої команди» пройшла модерацію.', entityType: 'opportunity', entityId: 'op5', read: true, at: now - d * 1 },
    { id: 'n5', type: 'application_status', title: 'Ваш відгук у шорт-листі', body: 'Статус відгуку змінено на «Шорт-ліст».', entityType: 'opportunity', entityId: 'op1', read: true, at: now - d * 1 - h * 3 },
    { id: 'n6', type: 'event_reminder', title: 'Подія завтра', body: 'Sport Business Networking Night — 19:00.', entityType: 'event', entityId: 'e4', read: true, at: now - d * 2 },
    { id: 'n7', type: 'verification', title: 'Профіль на верифікації', body: 'Ми перевіряємо ваш профіль — це займає до 3 днів.', read: true, at: now - d * 3 },
    { id: 'n8', type: 'admin_message', title: 'Вітаємо у Sport Market Review', body: 'Заповніть профіль, щоб отримувати релевантні знайомства.', read: true, at: now - d * 4 },
  ];
}

export const Notifications = {
  async seed(): Promise<void> {
    const s = await load();
    if (s.seeded) return;
    s.items = [...demo(), ...s.items];
    s.seeded = true;
    await save(s);
  },
  async list(): Promise<Notification[]> { return (await load()).items.slice().sort((a, b) => b.at - a.at); },
  async unreadCount(): Promise<number> { return (await load()).items.filter((i) => !i.read).length; },
  async markRead(id: string): Promise<void> {
    const s = await load(); s.items = s.items.map((i) => i.id === id ? { ...i, read: true } : i); await save(s);
  },
  async markAllRead(): Promise<void> {
    const s = await load(); s.items = s.items.map((i) => ({ ...i, read: true })); await save(s);
  },
  async getPrefs(): Promise<Preferences> { return (await load()).prefs; },
  async setPref(group: string, on: boolean): Promise<void> {
    const s = await load(); s.prefs = { ...s.prefs, [group]: on }; await save(s);
  },
  // Заглушка для майбутнього push (expo-notifications). Не обовʼязково для MVP.
  async registerForPush(): Promise<{ ok: boolean; reason: string }> { return { ok: false, reason: 'push-not-configured' }; },
};
