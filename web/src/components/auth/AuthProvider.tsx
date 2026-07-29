"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabaseBrowser";

interface AuthUser { id: string; email: string | null; }
interface AuthCtx {
  ready: boolean;
  configured: boolean;
  user: AuthUser | null;
  token: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setReady(true); return; }
    const sb = getSupabaseBrowser();
    const apply = (session: { user?: { id: string; email?: string }; access_token?: string } | null) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
      setToken(session?.access_token ?? null);
      setReady(true);
    };
    sb.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => apply(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = getSupabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: window.location.href } });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => { if (isSupabaseConfigured) await getSupabaseBrowser().auth.signOut(); }, []);

  return (
    <Ctx.Provider value={{ ready, configured: isSupabaseConfigured, user, token, signInWithEmail, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
