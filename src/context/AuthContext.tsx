import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { getCurrentSession, onAuthStateChange } from "../services/authService";
import { syncNow } from "../services/syncService";

interface AuthContextValue {
  /** True once both env vars exist — whether cloud sync is possible on this deployment at all. */
  cloudAvailable: boolean;
  session: Session | null;
  user: User | null;
  /** True while the initial session check is in flight, so the UI doesn't flash "signed out" before it knows. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Parallel to AppContext (the local-profile/guest state), this tracks only
// the Supabase auth session. The two are deliberately independent: a user
// can be a fully-functional guest (AppContext has a local profile) with no
// Supabase session at all.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Guards against syncing the same session twice — onAuthStateChange can
  // fire more than once for one logical sign-in (e.g. a token refresh right
  // after SIGNED_IN), and the initial getCurrentSession() load races the
  // subscription's own first event.
  const syncedUserIdRef = useRef<string | null>(null);

  function syncOnceFor(userId: string) {
    if (syncedUserIdRef.current === userId) return;
    syncedUserIdRef.current = userId;
    // Fire-and-forget: this is a background convenience sync covering a
    // restored session on reload, which doesn't go through AccountSheet's
    // own explicit syncNow() call. Errors surface via syncService's status
    // listeners, not here.
    void syncNow(userId);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    getCurrentSession().then((s) => {
      if (!cancelled) {
        setSession(s);
        setLoading(false);
        if (s?.user) syncOnceFor(s.user.id);
      }
    });

    const unsubscribe = onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" && s?.user) syncOnceFor(s.user.id);
      if (event === "SIGNED_OUT") syncedUserIdRef.current = null;
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ cloudAvailable: isSupabaseConfigured, session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
