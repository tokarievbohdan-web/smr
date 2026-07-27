import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventItem } from './shellData';

/**
 * Локальний "бекенд" модуля Подій (swap → Supabase).
 * Зберігає реєстрації користувача (статус на подію) та створені події (на модерацію).
 */

export interface Registration { eventId: string; eventTitle: string; status: string; at: number }

interface Store { registrations: Registration[]; created: EventItem[] }

const KEY = 'smr_event_store_v1';
const empty: Store = { registrations: [], created: [] };

const load = async (): Promise<Store> => {
  try { return { ...empty, ...JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') }; }
  catch { return { ...empty }; }
};
const save = (s: Store) => AsyncStorage.setItem(KEY, JSON.stringify(s));
const uid = (p: string) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

export const EventStore = {
  load,
  async setRegistration(eventId: string, eventTitle: string, status: string): Promise<void> {
    const s = await load();
    const rec: Registration = { eventId, eventTitle, status, at: Date.now() };
    s.registrations = [rec, ...s.registrations.filter((r) => r.eventId !== eventId)];
    await save(s);
  },
  async getRegistration(eventId: string): Promise<Registration | undefined> {
    return (await load()).registrations.find((r) => r.eventId === eventId);
  },
  async listRegistrations(): Promise<Registration[]> {
    return (await load()).registrations.filter((r) => r.status === 'registered' || r.status === 'waitlist');
  },
  async createEvent(data: EventItem): Promise<EventItem> {
    const s = await load();
    const rec = { ...data, id: data.id || uid('ev') };
    s.created = [rec, ...s.created];
    await save(s);
    return rec;
  },
  async listCreated(): Promise<EventItem[]> { return (await load()).created; },
};
