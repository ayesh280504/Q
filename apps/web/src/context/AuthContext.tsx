import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DjProfile } from "@q/shared";
import type { Session } from "@supabase/supabase-js";
import { fetchMe, getAccountToken, saveAccountToken } from "../lib/accountApi";
import { ensureQProfile } from "../lib/ensureQProfile";
import { supabase, supabaseConfigured } from "../lib/supabase";

interface AuthContextValue {
  loading: boolean;
  profileLoading: boolean;
  supabaseSession: Session | null;
  profile: DjProfile | null;
  signedIn: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DjProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!supabaseSession && !getAccountToken()) {
      setProfile(null);
      return;
    }
    try {
      const { user } = await fetchMe();
      setProfile(user);
    } catch {
      setProfile(null);
    }
  }, [supabaseSession]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSupabaseSession(data.session);
      }
      setLoading(false);
    }

    void init();

    if (!supabase) return () => {
      mounted = false;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!supabaseSession && !getAccountToken()) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    void (async () => {
      try {
        if (supabaseSession) {
          await ensureQProfile(supabaseSession);
        }
        if (!cancelled) await refreshProfile();
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, supabaseSession, refreshProfile]);

  const signOut = useCallback(async () => {
    saveAccountToken(null);
    setProfile(null);
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      loading,
      profileLoading,
      supabaseSession,
      profile,
      signedIn: Boolean(supabaseSession || getAccountToken()) && Boolean(profile),
      refreshProfile,
      signOut,
    }),
    [loading, profileLoading, supabaseSession, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { supabaseConfigured };
