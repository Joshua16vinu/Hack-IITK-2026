"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

export type AnalysisMode = "rapid" | "deep" | "smart";

const MODE_STORAGE_KEY = "analysisMode";
const DEFAULT_MODE: AnalysisMode = "smart";

interface ModeContextValue {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
}

const ModeContext = createContext<ModeContextValue>({
  mode: DEFAULT_MODE,
  setMode: () => {},
});

export const useMode = () => useContext(ModeContext);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AnalysisMode>(DEFAULT_MODE);

  useEffect(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as AnalysisMode | null;
    if (stored && ["rapid", "deep", "smart"].includes(stored)) {
      setModeState(stored);
    } else {
      // No stored mode yet — persist the default so API calls always have a value
      localStorage.setItem(MODE_STORAGE_KEY, DEFAULT_MODE);
    }
  }, []);

  const setMode = useCallback((newMode: AnalysisMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

/** Utility: read mode directly from localStorage (for use outside React) */
export const getStoredMode = (): AnalysisMode => {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = localStorage.getItem(MODE_STORAGE_KEY) as AnalysisMode | null;
  return stored && ["rapid", "deep", "smart"].includes(stored)
    ? stored
    : DEFAULT_MODE;
};
