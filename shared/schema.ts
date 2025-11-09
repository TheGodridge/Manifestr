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
export const musicPackSchema = z.enum(["Theta Waves", "Ocean Meditation", "Forest Ambience"]);
export type MusicPack = z.infer<typeof musicPackSchema>;

// Focus level (difficulty) options
export const focusLevelSchema = z.enum(["Novice", "Intermediate", "Advanced", "Expert"]);
export type FocusLevel = z.infer<typeof focusLevelSchema>;

// Preferences
export const preferencesSchema = z.object({
  theme: themeSchema,
  music: musicPackSchema,
  quoteIntervalSec: z.number().int().positive(),
  autoDepositOnExit: z.boolean(),
  volume: z.number().min(0).max(100),
  focusLevel: focusLevelSchema,
});

export type Preferences = z.infer<typeof preferencesSchema>;

// App State stored in localStorage
export const appStateSchema = z.object({
  bankTotalCents: z.number().int().min(0),
  history: z.array(depositHistorySchema),
  preferences: preferencesSchema,
  favorites: z.array(z.string()),
  customQuotes: z.array(z.string()),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastDepositDate: z.number().nullable(),
});

export type AppState = z.infer<typeof appStateSchema>;

// Session state (in-memory, not persisted)
export type SessionState = "idle" | "running" | "paused" | "depositing";

// Default values
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "Galaxy",
  music: "Theta Waves",
  quoteIntervalSec: 15,
  autoDepositOnExit: false,
  volume: 50,
  focusLevel: "Intermediate",
};

export const DEFAULT_APP_STATE: AppState = {
  bankTotalCents: 0,
  history: [],
  preferences: DEFAULT_PREFERENCES,
  favorites: [],
  customQuotes: [],
  currentStreak: 0,
  longestStreak: 0,
  lastDepositDate: null,
};

// Starter affirmations - 100 manifestation quotes
export const STARTER_QUOTES = [
  "I'm aligned with success.",
  "Every breath attracts opportunity.",
  "Wealth flows where focus goes.",
  "I radiate calm, confidence, and abundance.",
  "I welcome unexpected money with gratitude.",
  "My potential to succeed is limitless.",
  "I am worthy of my dreams.",
  "The universe conspires in my favor.",
  "I trust the timing of my life.",
  "Abundance flows to me effortlessly.",
  "I am becoming the best version of myself.",
  "My mind is clear, focused, and sharp.",
  "I attract prosperity with every thought.",
  "Today, I choose peace over worry.",
  "I am grateful for this moment of stillness.",
  "My energy creates my reality.",
  "I release what no longer serves me.",
  "Every challenge is an opportunity to grow.",
  "I am exactly where I need to be.",
  "My intentions manifest into reality.",
  "I deserve all the good coming my way.",
  "I am open to infinite possibilities.",
  "My actions are aligned with my purpose.",
  "I trust my inner wisdom completely.",
  "The present moment is full of joy.",
  "I am a magnet for miracles.",
  "My focus creates my future.",
  "I choose thoughts that empower me.",
  "I am safe, supported, and loved.",
  "My breath connects me to abundance.",
  "I release resistance and embrace flow.",
  "Every cell in my body vibrates with energy and health.",
  "I am the architect of my life, building it one focused moment at a time.",
  "The quiet moments I give myself today become the foundation of tomorrow's success.",
  "I honor this time of stillness as an investment in my highest self.",
  "My worth is not measured by productivity, but by presence.",
  "I am becoming magnetic to the experiences I desire.",
  "In this moment, I have everything I need.",
  "My vision for the future is clear and compelling.",
  "I trust that everything is unfolding for my benefit.",
  "I am grateful for the abundance that surrounds me now.",
  "Each breath I take fills me with calm confidence.",
  "I release the need to control and trust the process.",
  "My inner peace is my greatest power.",
  "I attract opportunities that align with my soul's purpose.",
  "I am worthy of rest, renewal, and deep focus.",
  "The universe supports my every desire.",
  "I choose to see beauty in this present moment.",
  "My thoughts shape my reality with precision.",
  "I am deserving of wealth, health, and happiness.",
  "I let go of fear and step into faith.",
  "Every moment spent in stillness multiplies my effectiveness.",
  "I am a powerful creator of my experience.",
  "My focus is my superpower.",
  "I trust my path even when I cannot see the destination.",
  "I am open to receiving all forms of abundance.",
  "My calm center is always accessible to me.",
  "I honor my need for quiet reflection.",
  "I am exactly where I am meant to be right now.",
  "My energy is precious and I direct it wisely.",
  "I welcome prosperity in expected and unexpected ways.",
  "I am resilient, capable, and strong.",
  "Every breath brings me closer to my goals.",
  "I choose presence over perfection.",
  "My life is a reflection of my inner state.",
  "I am grateful for this opportunity to pause and center myself.",
  "The more I rest, the more I accomplish.",
  "I trust in divine timing.",
  "My worthiness is inherent, not earned.",
  "I am surrounded by infinite potential.",
  "I release comparison and embrace my unique journey.",
  "My focus today creates my reality tomorrow.",
  "I am open to miracles unfolding in my life.",
  "Every challenge contains a hidden gift.",
  "I choose faith over doubt.",
  "My inner wisdom guides me perfectly.",
  "I am a vessel for creative inspiration.",
  "I honor the sacred pause between action and reaction.",
  "My breath is my anchor to the present moment.",
  "I trust that I am being guided to my highest good.",
  "I am worthy of taking up space and time for myself.",
  "My stillness is productive, my rest is generative.",
  "I welcome the abundance that is my birthright.",
  "I am aligned with the frequency of prosperity.",
  "Every moment of focus compounds into greatness.",
  "I release the past and step fully into now.",
  "My peace of mind is the foundation of my success.",
  "I am grateful for the journey, not just the destination.",
  "I choose to see obstacles as opportunities in disguise.",
  "My energy attracts my tribe, my vibe attracts my life.",
  "I am becoming more aligned with each conscious breath.",
  "I trust myself to make decisions that serve my highest good.",
  "The universe is always working in my favor, even when I can't see it.",
  "I release the need for external validation and trust my inner knowing.",
  "My focus is a form of devotion to my future self.",
  "I am worthy of all the time, space, and resources I need to thrive.",
  "In stillness, I find clarity. In clarity, I find power. In power, I find peace.",
  "I honor the wisdom of slowing down in a world that glorifies speed.",
  "My presence is my greatest gift to myself and others.",
  "I am learning to distinguish between what is urgent and what is important.",
  "Every moment I invest in myself pays dividends I cannot yet imagine.",
];

// Difficulty configurations
// Novice: Fast earnings, reaches max quickly (good for beginners)
// Intermediate: Balanced progression
// Advanced: Slower, encourages 10-minute sessions
// Expert: Slowest, encourages 15-20 minute deep meditation sessions
export interface DifficultyConfig {
  baseRateCentsPerSec: number;  // Base earning rate
  growthFactor: number;          // Exponential growth factor
  growthIntervalSec: number;     // How often growth is applied
  maxMultiplier: number;         // Maximum multiplier cap
}

export const DIFFICULTY_CONFIGS: Record<FocusLevel, DifficultyConfig> = {
  "Novice": {
    baseRateCentsPerSec: 8,      // $0.08/sec (fastest)
    growthFactor: 1.025,         // 2.5% growth
    growthIntervalSec: 20,       // Every 20 seconds
    maxMultiplier: 2.5,          // Caps at 2.5x around 5 minutes
  },
  "Intermediate": {
    baseRateCentsPerSec: 5,      // $0.05/sec (current default)
    growthFactor: 1.02,          // 2% growth
    growthIntervalSec: 30,       // Every 30 seconds
    maxMultiplier: 3.5,          // Caps at 3.5x around 10 minutes
  },
  "Advanced": {
    baseRateCentsPerSec: 3,      // $0.03/sec (slower)
    growthFactor: 1.018,         // 1.8% growth
    growthIntervalSec: 35,       // Every 35 seconds
    maxMultiplier: 4.5,          // Caps at 4.5x around 15 minutes
  },
  "Expert": {
    baseRateCentsPerSec: 2,      // $0.02/sec (slowest, most challenging)
    growthFactor: 1.015,         // 1.5% growth
    growthIntervalSec: 40,       // Every 40 seconds
    maxMultiplier: 5.0,          // Caps at 5.0x around 20 minutes
  },
};
