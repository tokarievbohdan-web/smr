import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Локальний "бекенд" дій у Мережі (swap → Supabase).
 * Зберігає запити на знайомство, скарги та запити на управління організацією.
 * Усі дії користувача зберігаються тут, аналог IntroductionRequest / Report у моделі даних.
 */

export interface IntroRequest { id: string; targetId: string; targetName: string; note?: string; at: number }
export interface ReportRecord { id: string; targetId: string; targetName: string; reason: string; at: number }
export interface OrgAccessRequest { id: string; orgId: string; orgName: string; role?: string; at: number }

interface NetworkStore { intros: IntroRequest[]; reports: ReportRecord[]; orgAccess: OrgAccessRequest[] }

const KEY = 'smr_network_actions_v1';
const empty: NetworkStore = { intros: [], reports: [], orgAccess: [] };

const load = async (): Promise<NetworkStore> => {
  try { return { ...empty, ...JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') }; }
  catch { return { ...empty }; }
};
const save = (s: NetworkStore) => AsyncStorage.setItem(KEY, JSON.stringify(s));
const uid = (p: string) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

export const NetworkActions = {
  load,
  async requestIntro(targetId: string, targetName: string, note?: string): Promise<IntroRequest> {
    const s = await load();
    const rec: IntroRequest = { id: uid('intro'), targetId, targetName, note, at: Date.now() };
    s.intros = [rec, ...s.intros.filter((i) => i.targetId !== targetId)];
    await save(s);
    return rec;
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
  async introSentIds(): Promise<string[]> { return (await load()).intros.map((i) => i.targetId); },
  async orgAccessIds(): Promise<string[]> { return (await load()).orgAccess.map((r) => r.orgId); },
};
