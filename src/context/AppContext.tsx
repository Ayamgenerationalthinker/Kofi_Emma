import { createContext, useContext, type ReactNode } from "react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb, storageAvailable } from "../lib/localDb";
import type { User } from "../lib/types";

interface AppContextValue {
  user: User | null;
  storageAvailable: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

// There is no server, so there is nothing to fetch: the user profile is
// read directly (and reactively, via useLocalDbVersion) out of LocalStorage.
export function AppProvider({ children }: { children: ReactNode }) {
  useLocalDbVersion();
  const user = getDb().user;

  return <AppContext.Provider value={{ user, storageAvailable }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
}
