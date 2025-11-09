import { z } from "zod";

// Deposit History Entry
export const depositHistorySchema = z.object({
  id: z.string(),
  amountCents: z.number().int().min(0),
  durationSec: z.number().int().min(0),
  label: z.string(),
  timestamp: z.number(),
});

export type DepositHistory = z.infer<typeof depositHistorySchema>;

// Theme options
export const themeSchema = z.enum(["Galaxy", "Ocean", "Neon Glow", "Minimal"]);
export type Theme = z.infer<typeof themeSchema>;

// Music pack options
export const musicPackSchema = z.enum(["LoFi", "528Hz", "Waves"]);
export type MusicPack = z.infer<typeof musicPackSchema>;

// Preferences
export const preferencesSchema = z.object({
  theme: themeSchema,
  music: musicPackSchema,
  quoteIntervalSec: z.number().int().positive(),
  autoDepositOnExit: z.boolean(),
  volume: z.number().min(0).max(100),
});

export type Preferences = z.infer<typeof preferencesSchema>;

// App State stored in localStorage
export const appStateSchema = z.object({
  bankTotalCents: z.number().int().min(0),
  history: z.array(depositHistorySchema),
  preferences: preferencesSchema,
  favorites: z.array(z.string()),
});

export type AppState = z.infer<typeof appStateSchema>;

// Session state (in-memory, not persisted)
export type SessionState = "idle" | "running" | "paused" | "depositing";

// Default values
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "Galaxy",
  music: "LoFi",
  quoteIntervalSec: 15,
  autoDepositOnExit: false,
  volume: 50,
};

export const DEFAULT_APP_STATE: AppState = {
  bankTotalCents: 0,
  history: [],
  preferences: DEFAULT_PREFERENCES,
  favorites: [],
};

// Starter affirmations
export const STARTER_QUOTES = [
  "I'm aligned with success.",
  "Every breath attracts opportunity.",
  "Wealth flows where focus goes.",
  "I radiate calm, confidence, and abundance.",
  "I welcome unexpected money with gratitude.",
];

// Earn rate constant
export const EARN_RATE_CENTS_PER_SEC = 5; // $0.05/sec
