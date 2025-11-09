import { useState, useEffect } from "react";
import { AppState, DEFAULT_APP_STATE, appStateSchema } from "@shared/schema";

const STORAGE_KEY = "manifestr_state";

export function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return appStateSchema.parse(parsed);
      }
    } catch (error) {
      console.error("Failed to load app state:", error);
    }
    return DEFAULT_APP_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (error) {
      console.error("Failed to save app state:", error);
    }
  }, [appState]);

  return [appState, setAppState] as const;
}
