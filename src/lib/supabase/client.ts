import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True only when both env vars are actually present. Every cloud-sync
 * consumer in the app must check this (or that `supabase` isn't null)
 * before touching the network — cloud sync is optional, and the app must
 * remain fully usable in guest/offline mode with neither var set. Never
 * claim "Supabase is configured" from code alone; this flag is the one
 * place that's actually true.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Null when not configured — every call site is written to fall back to
 * LocalStorage-only behavior in that case rather than crashing. Only the
 * public anon key is ever used here; it is safe to ship to the browser
 * because supabase/schema.sql enables Row Level Security on every table,
 * so the anon key alone can never read or write another user's rows.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "abeleDrumsCoach:supabase-auth",
      },
    })
  : null;
