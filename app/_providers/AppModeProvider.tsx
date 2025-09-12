"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { AppMode } from "@/app/_types";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  selectedNote: string | null;
  setSelectedNote: (id: string | null) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("checklists");
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("app-mode");
    if (savedMode === "checklists" || savedMode === "docs") {
      setMode(savedMode);
    }
  }, []);

  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem("app-mode", newMode);
  };

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        selectedNote,
        setSelectedNote,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}
