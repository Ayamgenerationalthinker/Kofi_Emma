import { createContext, useContext, useState, type ReactNode } from "react";

// Section 110: an active practice part can hide the chrome (header + bottom
// nav) for a focused, fullscreen-feeling session. A tiny shared boolean is
// all that's needed — Practice sets it, Layout reads it.
interface ImmersiveContextValue {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
}

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null);

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  return <ImmersiveContext.Provider value={{ immersive, setImmersive }}>{children}</ImmersiveContext.Provider>;
}

export function useImmersive(): ImmersiveContextValue {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) throw new Error("useImmersive must be used within an ImmersiveProvider");
  return ctx;
}
