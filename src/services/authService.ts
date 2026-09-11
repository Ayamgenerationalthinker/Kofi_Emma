import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase/client";
import { AppError } from "../lib/errors";

function requireSupabase() {
  if (!supabase) {
    throw new AppError(
      "CLOUD_SYNC_UNAVAILABLE",
      "Cloud sync isn't configured on this deployment. Your progress is still saved on this device."
    );
  }
  return supabase;
}

export interface SignUpResult {
  user: User | null;
  /**
   * Null whenever Supabase's "Confirm email" setting is on (its default) —
   * `user` is still returned non-null in that case, so callers must check
   * `session`, never just `user`, to tell "signed up and already usable"
   * apart from "signed up, but must confirm their email before anything
   * else (including a sync) can work."
   */
  session: Session | null;
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new AppError("AUTH_ERROR", error.message);
  return { user: data.user, session: data.session };
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new AppError("AUTH_ERROR", error.message);
  return data.user;
}

export async function signOut(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new AppError("AUTH_ERROR", error.message);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) throw new AppError("AUTH_ERROR", error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw new AppError("AUTH_ERROR", error.message);
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Subscribes to auth state changes. Returns a no-op unsubscribe if Supabase isn't configured. */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => subscription.unsubscribe();
}
