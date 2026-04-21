import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  accent_color: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "display_name" | "accent_color">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (sess?.user) {
        // defer to avoid deadlock
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
    updateProfile: async (patch) => {
      if (!session?.user) return;
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("user_id", session.user.id);
      if (error) throw error;
      await loadProfile(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ACCENT_PALETTE: { id: string; label: string; value: string }[] = [
  { id: "magenta", label: "Magenta", value: "oklch(0.65 0.27 330)" },
  { id: "violet", label: "Violet", value: "oklch(0.6 0.24 290)" },
  { id: "blue", label: "Bleu", value: "oklch(0.65 0.2 250)" },
  { id: "teal", label: "Émeraude", value: "oklch(0.7 0.16 180)" },
  { id: "lime", label: "Lime", value: "oklch(0.78 0.18 130)" },
  { id: "amber", label: "Ambre", value: "oklch(0.78 0.17 75)" },
  { id: "coral", label: "Corail", value: "oklch(0.7 0.2 30)" },
  { id: "rose", label: "Rose", value: "oklch(0.72 0.2 0)" },
];

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
