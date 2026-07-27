import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth-шар Sport Market Review.
 * Passwordless: email + one-time code (як magic link).
 * Зараз "бекенд" локальний (AsyncStorage) через AuthService нижче —
 * пізніше замінюється на Supabase Auth без зміни екранів.
 */

export type AccountStatus = 'active' | 'suspended';
export interface Profile { firstName?: string; lastName?: string; position?: string; org?: string; city?: string; bio?: string; photo?: string }
export interface UserRecord {
  email: string;
  status: AccountStatus;
  emailConfirmed: boolean;
  userType?: string;
  sports?: string[];
  directions?: string[];
  contentCategories?: string[];
  goals?: string[];
  profile?: Profile;
  onboardingStep: number; // 0 = не почато … 4 = завершено
  createdAt: number;
}

const USERS = 'smr_users_v1';
const SESSION = 'smr_session_v1';
const ONBOARDING_DONE = 4;

// ── Локальний "бекенд" (swap → Supabase) ──────────────
const loadUsers = async (): Promise<Record<string, UserRecord>> => {
  try { return JSON.parse((await AsyncStorage.getItem(USERS)) || '{}'); } catch { return {}; }
};
const saveUsers = (u: Record<string, UserRecord>) => AsyncStorage.setItem(USERS, JSON.stringify(u));
const pendingCodes: Record<string, string> = {}; // одноразові коди (в памʼяті)
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const norm = (e: string) => e.trim().toLowerCase();
const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Демо-акаунти для перевірки сценаріїв
async function seed() {
  const u = await loadUsers();
  let changed = false;
  if (!u['olena@club.ua']) {
    u['olena@club.ua'] = {
      email: 'olena@club.ua', status: 'active', emailConfirmed: true, onboardingStep: ONBOARDING_DONE, createdAt: 1,
      userType: 'Представник організації', goals: ['знайти партнерів'],
      profile: { firstName: 'Олена', lastName: 'Ковальчук', position: 'Head of Sponsorship', org: 'ФК «Динамо» Київ', city: 'Київ', bio: '10 років у спортивній комерції.' },
    };
    changed = true;
  }
  if (!u['blocked@smr.ua']) {
    u['blocked@smr.ua'] = { email: 'blocked@smr.ua', status: 'suspended', emailConfirmed: true, onboardingStep: ONBOARDING_DONE, createdAt: 1 };
    changed = true;
  }
  if (changed) await saveUsers(u);
}

export const AuthService = {
  emailValid,
  async requestCode(email: string): Promise<{ isNew: boolean; devCode: string }> {
    const e = norm(email);
    const users = await loadUsers();
    const code = genCode();
    pendingCodes[e] = code;
    return { isNew: !users[e], devCode: code };
  },
  async verifyCode(email: string, code: string): Promise<{ ok: boolean; error?: string; user?: UserRecord }> {
    const e = norm(email);
    if (!pendingCodes[e]) return { ok: false, error: 'Код застарів. Надішліть новий.' };
    if (pendingCodes[e] !== code.trim()) return { ok: false, error: 'Невірний код. Спробуйте ще раз.' };
    const users = await loadUsers();
    let user = users[e];
    if (!user) {
      user = { email: e, status: 'active', emailConfirmed: true, onboardingStep: 0, createdAt: Date.now() };
      users[e] = user;
    } else {
      user.emailConfirmed = true;
    }
    await saveUsers(users);
    delete pendingCodes[e];
    await AsyncStorage.setItem(SESSION, JSON.stringify({ email: e }));
    return { ok: true, user };
  },
  async currentUser(): Promise<UserRecord | null> {
    try {
      const s = JSON.parse((await AsyncStorage.getItem(SESSION)) || 'null');
      if (!s?.email) return null;
      const users = await loadUsers();
      return users[s.email] || null;
    } catch { return null; }
  },
  async patch(email: string, partial: Partial<UserRecord>): Promise<UserRecord> {
    const users = await loadUsers();
    const u = { ...users[email], ...partial } as UserRecord;
    users[email] = u;
    await saveUsers(users);
    return u;
  },
  async signOut() { await AsyncStorage.removeItem(SESSION); },
};

// ── Context ───────────────────────────────────────────
type Ctx = {
  loading: boolean;
  user: UserRecord | null;
  isGuest: boolean;
  isAuthed: boolean;         // є сесія
  suspended: boolean;
  needsOnboarding: boolean;
  authPrompt: boolean;       // гість натиснув захищену дію
  requestCode: (email: string) => Promise<{ isNew: boolean; devCode: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string; blocked?: boolean }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  saveOnboarding: (partial: Partial<UserRecord>) => Promise<void>;
  promptSignIn: () => void;
  dismissPrompt: () => void;
};

const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);
export const ONBOARDING_STEPS = ONBOARDING_DONE;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isGuest, setGuest] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    (async () => {
      await seed();
      const u = await AuthService.currentUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const requestCode = useCallback((email: string) => AuthService.requestCode(email), []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const r = await AuthService.verifyCode(email, code);
    if (!r.ok) return { ok: false, error: r.error };
    setUser(r.user!);
    setGuest(false);
    setAuthPrompt(false);
    return { ok: true, blocked: r.user!.status === 'suspended' };
  }, []);

  const continueAsGuest = useCallback(() => { setGuest(true); setAuthPrompt(false); }, []);
  const signOut = useCallback(async () => { await AuthService.signOut(); setUser(null); setGuest(false); }, []);
  const saveOnboarding = useCallback(async (partial: Partial<UserRecord>) => {
    if (!user) return;
    const u = await AuthService.patch(user.email, partial);
    setUser(u);
  }, [user]);
  const promptSignIn = useCallback(() => setAuthPrompt(true), []);
  const dismissPrompt = useCallback(() => setAuthPrompt(false), []);

  const value: Ctx = {
    loading, user, isGuest,
    isAuthed: !!user,
    suspended: user?.status === 'suspended',
    needsOnboarding: !!user && user.status === 'active' && user.onboardingStep < ONBOARDING_DONE,
    authPrompt,
    requestCode, verifyCode, continueAsGuest, signOut, saveOnboarding, promptSignIn, dismissPrompt,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
