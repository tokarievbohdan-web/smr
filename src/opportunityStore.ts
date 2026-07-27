import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpportunityItem } from './shellData';

/**
 * Локальний "бекенд" модуля Можливостей (swap → Supabase).
 * Зберігає створені можливості, відгуки користувача, зміни статусів відгуків,
 * внутрішні нотатки автора та стан публікації (пауза/закриття).
 */

export interface MyApplication { id: string; oppId: string; oppTitle: string; message: string; portfolio?: string; attachment?: string; status: string; at: number }

interface Store {
  created: OpportunityItem[];                               // опубліковані користувачем можливості
  applications: MyApplication[];                            // мої відгуки
  appStatus: Record<string, Record<string, string>>;       // oppId → applicantId → статус
  notes: Record<string, Record<string, string>>;           // oppId → applicantId → нотатка
  oppState: Record<string, string>;                         // oppId → ключ статусу публікації (пауза/закриття)
}

const KEY = 'smr_opportunity_store_v1';
const empty: Store = { created: [], applications: [], appStatus: {}, notes: {}, oppState: {} };

const load = async (): Promise<Store> => {
  try { return { ...empty, ...JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') }; }
  catch { return { ...empty }; }
};
const save = (s: Store) => AsyncStorage.setItem(KEY, JSON.stringify(s));
const uid = (p: string) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

export const OpportunityStore = {
  load,
  async listCreated(): Promise<OpportunityItem[]> { return (await load()).created; },
  async createOpp(data: OpportunityItem): Promise<OpportunityItem> {
    const s = await load();
    const rec = { ...data, id: data.id || uid('op') };
    s.created = [rec, ...s.created];
    await save(s);
    return rec;
  },
  async apply(oppId: string, oppTitle: string, message: string, portfolio?: string, attachment?: string): Promise<MyApplication> {
    const s = await load();
    const rec: MyApplication = { id: uid('app'), oppId, oppTitle, message, portfolio, attachment, status: 'new', at: Date.now() };
    s.applications = [rec, ...s.applications.filter((a) => a.oppId !== oppId)];
    await save(s);
    return rec;
  },
  async myApplications(): Promise<MyApplication[]> { return (await load()).applications; },
  async appliedIds(): Promise<string[]> { return (await load()).applications.map((a) => a.oppId); },
  async withdraw(oppId: string): Promise<void> {
    const s = await load();
    s.applications = s.applications.map((a) => (a.oppId === oppId ? { ...a, status: 'withdrawn' } : a));
    await save(s);
  },

  // ── Автор ──
  async setApplicantStatus(oppId: string, applicantId: string, status: string): Promise<void> {
    const s = await load();
    s.appStatus[oppId] = { ...(s.appStatus[oppId] || {}), [applicantId]: status };
    await save(s);
  },
  async getAppStatuses(oppId: string): Promise<Record<string, string>> { return (await load()).appStatus[oppId] || {}; },
  async setNote(oppId: string, applicantId: string, note: string): Promise<void> {
    const s = await load();
    s.notes[oppId] = { ...(s.notes[oppId] || {}), [applicantId]: note };
    await save(s);
  },
  async getNotes(oppId: string): Promise<Record<string, string>> { return (await load()).notes[oppId] || {}; },
  async setOppState(oppId: string, statusKey: string): Promise<void> {
    const s = await load();
    s.oppState[oppId] = statusKey;
    await save(s);
  },
  async getOppState(oppId: string): Promise<string | undefined> { return (await load()).oppState[oppId]; },
};
