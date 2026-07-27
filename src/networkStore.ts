import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Локальний "бекенд" дій у Мережі (swap → Supabase).
 * Зберігає запити на знайомство (IntroductionRequest), скарги (Report)
 * та запити на управління організацією. У MVP запити на знайомство
 * обробляються командою SMR вручну через web-адмінку — тут ми моделюємо
 * статуси й історію на боці користувача.
 */

export type IntroTargetType = 'person' | 'organization';
export type IntroRelatedType = 'article' | 'opportunity' | 'event';

export interface IntroHistoryEntry { status: string; at: number; note?: string }
export interface IntroRequest {
  id: string;
  targetType: IntroTargetType; targetId: string; targetName: string; targetRole?: string;
  reason: string; context: string; expectedResult?: string;
  relatedType?: IntroRelatedType; relatedId?: string; relatedLabel?: string;
  consent: boolean;
  status: string;
  infoRequest?: string; infoResponse?: string;
  history: IntroHistoryEntry[];
  createdAt: number; updatedAt: number;
}
// Дескриптор цілі знайомства (передається у форму запиту)
export interface IntroTarget {
  targetType: IntroTargetType; targetId: string; targetName: string; targetRole?: string;
  relatedType?: IntroRelatedType; relatedId?: string; relatedLabel?: string;
}

export interface ReportRecord { id: string; targetId: string; targetName: string; reason: string; at: number }
export interface OrgAccessRequest { id: string; orgId: string; orgName: string; role?: string; at: number }

interface NetworkStore { intros: IntroRequest[]; reports: ReportRecord[]; orgAccess: OrgAccessRequest[]; seededIntros?: boolean }

const KEY = 'smr_network_actions_v1';
const empty: NetworkStore = { intros: [], reports: [], orgAccess: [] };

const load = async (): Promise<NetworkStore> => {
  try { return { ...empty, ...JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') }; }
  catch { return { ...empty }; }
};
const save = (s: NetworkStore) => AsyncStorage.setItem(KEY, JSON.stringify(s));
const uid = (p: string) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

// Демо-історія запитів (щоб показати всі статуси; команда SMR обробляє вручну)
function demoIntros(): IntroRequest[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: 'di_seed1', targetType: 'person', targetId: 'p2', targetName: 'Андрій Мельник', targetRole: 'CMO · MEGOGO Sport',
      reason: 'Партнерство', context: 'Готуємо спільний медіапроєкт навколо матчдей-контенту.', expectedResult: 'Домовитися про пілотну співпрацю на сезон.',
      relatedType: 'article', relatedId: 'a4', relatedLabel: 'Як топ-клуби будують власні стрімінгові платформи',
      consent: true, status: 'sent',
      infoRequest: undefined, infoResponse: undefined,
      history: [
        { status: 'new', at: now - day * 6 },
        { status: 'review', at: now - day * 5 },
        { status: 'approved', at: now - day * 3 },
        { status: 'sent', at: now - day * 3 + 3600000, note: 'Контакти передано обом сторонам.' },
      ],
      createdAt: now - day * 6, updatedAt: now - day * 3 + 3600000,
    },
    {
      id: 'di_seed2', targetType: 'organization', targetId: 'o2', targetName: 'Українська асоціація футболу', targetRole: 'Федерація',
      reason: 'Спонсорство', context: 'Представляю fintech-бренд, цікавить категорійне партнерство збірних.', expectedResult: 'Отримати комерційну презентацію та контакт відділу партнерств.',
      relatedType: 'opportunity', relatedId: 'op2', relatedLabel: 'Титульне партнерство ліги на сезон 2026/27',
      consent: true, status: 'moreinfo',
      infoRequest: 'Уточніть, будь ласка, орієнтовний бюджет і бажаний напрям активацій — це пришвидшить розгляд.',
      history: [
        { status: 'new', at: now - day * 2 },
        { status: 'review', at: now - day * 2 + 7200000 },
        { status: 'moreinfo', at: now - day * 1, note: 'Команда SMR попросила уточнення.' },
      ],
      createdAt: now - day * 2, updatedAt: now - day * 1,
    },
    {
      id: 'di_seed3', targetType: 'person', targetId: 'p3', targetName: 'Ірина Савченко', targetRole: 'Commercial Director · УАФ',
      reason: 'Обмін досвідом', context: 'Хочу обговорити централізацію комерційних прав.', expectedResult: 'Коротка консультація або дзвінок.',
      consent: true, status: 'declined',
      history: [
        { status: 'new', at: now - day * 8 },
        { status: 'review', at: now - day * 7 },
        { status: 'declined', at: now - day * 6, note: 'Наразі сторона не розглядає нові знайомства.' },
      ],
      createdAt: now - day * 8, updatedAt: now - day * 6,
    },
  ];
}

export const NetworkActions = {
  load,
  async seedDemoIntros(): Promise<void> {
    const s = await load();
    if (s.seededIntros) return;
    s.intros = [...s.intros, ...demoIntros()];
    s.seededIntros = true;
    await save(s);
  },

  async createIntro(payload: Omit<IntroRequest, 'id' | 'status' | 'history' | 'createdAt' | 'updatedAt'>): Promise<IntroRequest> {
    const s = await load();
    const now = Date.now();
    const rec: IntroRequest = {
      ...payload, id: uid('intro'), status: 'new',
      history: [{ status: 'new', at: now }], createdAt: now, updatedAt: now,
    };
    s.intros = [rec, ...s.intros];
    await save(s);
    return rec;
  },
  async listIntros(): Promise<IntroRequest[]> {
    return (await load()).intros.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async getIntro(id: string): Promise<IntroRequest | undefined> {
    return (await load()).intros.find((i) => i.id === id);
  },
  async respondMoreInfo(id: string, text: string): Promise<void> {
    const s = await load();
    const now = Date.now();
    s.intros = s.intros.map((i) => i.id === id ? {
      ...i, infoResponse: text, status: 'review', updatedAt: now,
      history: [...i.history, { status: 'review', at: now, note: 'Ви надали додаткову інформацію.' }],
    } : i);
    await save(s);
  },
  // targetIds з активними (не відхиленими/закритими) запитами — для стану «Запит надіслано»
  async introTargetIds(): Promise<string[]> {
    return (await load()).intros.filter((i) => i.status !== 'declined' && i.status !== 'closed').map((i) => i.targetId);
  },
  // Кількість запитів, що потребують уваги користувача (додаткова інформація)
  async actionableIntroCount(): Promise<number> {
    return (await load()).intros.filter((i) => i.status === 'moreinfo').length;
  },

  async report(targetId: string, targetName: string, reason: string): Promise<ReportRecord> {
    const s = await load();
    const rec: ReportRecord = { id: uid('report'), targetId, targetName, reason, at: Date.now() };
    s.reports = [rec, ...s.reports];
    await save(s);
    return rec;
  },
  async requestOrgAccess(orgId: string, orgName: string, role?: string): Promise<OrgAccessRequest> {
    const s = await load();
    const rec: OrgAccessRequest = { id: uid('orgacc'), orgId, orgName, role, at: Date.now() };
    s.orgAccess = [rec, ...s.orgAccess.filter((r) => r.orgId !== orgId)];
    await save(s);
    return rec;
  },
  async orgAccessIds(): Promise<string[]> { return (await load()).orgAccess.map((r) => r.orgId); },
};
