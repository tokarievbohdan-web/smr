import type { UserRecord } from './AuthContext';
import { supabase } from './supabase';

/**
 * Supabase-реалізація auth-шару (email OTP + таблиця public.profiles).
 * Має той самий інтерфейс, що й локальний AuthService, тож AuthContext
 * і екрани не змінюються. Активується, коли задані ключі у supabaseConfig.
 */

const norm = (e: string) => e.trim().toLowerCase();
const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const db = () => supabase!; // викликається лише коли isSupabaseConfigured

function rowToUser(r: any): UserRecord {
  return {
    email: r.email,
    status: r.status || 'active',
    emailConfirmed: !!r.email_confirmed,
    verified: !!r.verified,
    userType: r.user_type ?? undefined,
    sports: r.sports ?? undefined,
    directions: r.directions ?? undefined,
    contentCategories: r.content_categories ?? undefined,
    goals: r.goals ?? undefined,
    availability: r.availability ?? undefined,
    profile: r.profile ?? undefined,
    settings: r.settings ?? undefined,
    onboardingStep: r.onboarding_step ?? 0,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}
function userToRow(p: Partial<UserRecord>): any {
  const row: any = {};
  if (p.status !== undefined) row.status = p.status;
  if (p.verified !== undefined) row.verified = p.verified;
  if (p.userType !== undefined) row.user_type = p.userType;
  if (p.sports !== undefined) row.sports = p.sports;
  if (p.directions !== undefined) row.directions = p.directions;
  if (p.contentCategories !== undefined) row.content_categories = p.contentCategories;
  if (p.goals !== undefined) row.goals = p.goals;
  if (p.availability !== undefined) row.availability = p.availability;
  if (p.profile !== undefined) row.profile = p.profile;
  if (p.settings !== undefined) row.settings = p.settings;
  if (p.onboardingStep !== undefined) row.onboarding_step = p.onboardingStep;
  return row;
}

export const SupabaseAuthService = {
  emailValid,
  async requestCode(email: string): Promise<{ isNew: boolean; devCode: string }> {
    const e = norm(email);
    const { data: existing } = await db().from('profiles').select('email').eq('email', e).maybeSingle();
    const { error } = await db().auth.signInWithOtp({ email: e });
    if (error) throw error;
    // Реальний код надходить листом; devCode недоступний.
    return { isNew: !existing, devCode: '' };
  },
  async verifyCode(email: string, code: string): Promise<{ ok: boolean; error?: string; user?: UserRecord }> {
    const e = norm(email);
    const { data, error } = await db().auth.verifyOtp({ email: e, token: code.trim(), type: 'email' });
    if (error || !data.user) return { ok: false, error: 'Невірний або застарілий код. Спробуйте ще раз.' };
    const uid = data.user.id;
    let { data: prof } = await db().from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!prof) {
      const { data: created, error: insErr } = await db()
        .from('profiles')
        .insert({ id: uid, email: e, status: 'active', email_confirmed: true, onboarding_step: 0 })
        .select('*')
        .single();
      if (insErr) return { ok: false, error: 'Не вдалося створити профіль.' };
      prof = created;
    }
    return { ok: true, user: rowToUser(prof) };
  },
  async currentUser(): Promise<UserRecord | null> {
    const { data: { session } } = await db().auth.getSession();
    if (!session) return null;
    const { data: prof } = await db().from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    return prof ? rowToUser(prof) : null;
  },
  async patch(_email: string, partial: Partial<UserRecord>): Promise<UserRecord> {
    const { data: { session } } = await db().auth.getSession();
    const id = session?.user.id;
    const { data } = await db().from('profiles').update(userToRow(partial)).eq('id', id).select('*').single();
    return rowToUser(data);
  },
  async signOut() { await db().auth.signOut(); },
  async remove(_email: string) {
    const { data: { session } } = await db().auth.getSession();
    if (session) await db().from('profiles').update({ status: 'deleted' }).eq('id', session.user.id);
    await db().auth.signOut();
  },
};
