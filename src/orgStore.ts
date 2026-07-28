import AsyncStorage from '@react-native-async-storage/async-storage';

/** Локальний "бекенд" організацій користувача (swap → Supabase). */
export interface CreatedOrg { id: string; name: string; type: string; city: string; shortDesc?: string; status: string; at: number }

const KEY = 'smr_org_store_v1';
const load = async (): Promise<CreatedOrg[]> => {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); } catch { return []; }
};
const uid = () => `org_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

export const OrgStore = {
  async list(): Promise<CreatedOrg[]> { return load(); },
  async create(data: Omit<CreatedOrg, 'id' | 'status' | 'at'>): Promise<CreatedOrg> {
    const list = await load();
    const rec: CreatedOrg = { ...data, id: uid(), status: 'На модерації', at: Date.now() };
    await AsyncStorage.setItem(KEY, JSON.stringify([rec, ...list]));
    return rec;
  },
};
