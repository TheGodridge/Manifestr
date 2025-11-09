import { useState, useEffect } from "react";
import { AppState, DEFAULT_APP_STATE, appStateSchema, MusicPack } from "@shared/schema";

const STORAGE_KEY = "manifestr_state";

// Migration map for old music pack names to new ones
const MUSIC_PACK_MIGRATION: Record<string, MusicPack> = {
  "Theta Waves": "Deep Space",
  "Ocean Meditation": "Cosmos",
  "Forest Ambience": "Forest Sonnet",
};

export function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migrate old music pack names to new ones
        if (parsed.preferences?.music && MUSIC_PACK_MIGRATION[parsed.preferences.music]) {
          parsed.preferences.music = MUSIC_PACK_MIGRATION[parsed.preferences.music];
        }
        
        // Deep merge with default state for missing fields (backward compatibility)
        const merged = {
          ...DEFAULT_APP_STATE,
          ...parsed,
          preferences: {
            ...DEFAULT_APP_STATE.preferences,
            ...(parsed.preferences || {}),
          },
        };
        return appStateSchema.parse(merged);
      }
    } catch (error) {
      console.error("Failed to load app state:", error);
      // Clear corrupted localStorage and start fresh
      localStorage.removeItem(STORAGE_KEY);
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
