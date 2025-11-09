# Manifestr

## Overview

Manifestr is a premium meditation and focus application with the tagline "Focus is the new currency." The app gamifies mindfulness by converting focused time into virtual currency, featuring a cosmic/ambient aesthetic inspired by premium meditation apps like Calm and Headspace, combined with streak mechanics similar to Duolingo.

Users read rotating affirmations, listen to ambient music, and watch a counter rise in real-time as they maintain focus. They can deposit their accumulated "currency" into a bank, view their history, and customize themes and audio experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for client-side routing with three main pages:
- `/` - Manifest screen (home)
- `/bank` - Bank/history screen
- `/settings` - Settings and preferences

**State Management**: 
- Local component state with React hooks for session management
- localStorage for persistent app state (bank balance, history, preferences, favorites)
- No external state management library; uses custom `useAppState` hook wrapping localStorage operations

**UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling

**Custom Components**:
- `AnimatedCounter`: Smooth counter transitions with coin-drop animation on deposits
- `FocusMultiplierBar`: Progress bar with milestone markers, color shifts (purple → gold), and glow intensity based on multiplier level
- `FireChip`: Streak display with flame icon and pulse animation
- `DepositModal`: Confirmation dialog for banking earnings

**Design System**:
- Custom cosmic/ambient color palette (Night Sky #0A0D2A, Aurora Purple #3B0A66, Gold #F8D94E)
- Four theme variations: Galaxy (default), Ocean, Neon Glow, Minimal
- Typography using Inter/Poppins fonts
- Spacing based on Tailwind scale (2, 3, 5, 8, 12, 16, 20, 32, 48)
- Custom animations: gradient drift background (15s cycle), shimmer sweep, coin-drop bounce, micro-interactions on buttons
- All animations respect `prefers-reduced-motion` user preference

### Backend Architecture

**Server**: Express.js with TypeScript running on Node.js

**API Structure**: Currently minimal with placeholder routes structure at `/api/*` prefix

**Session Management**: Configured to use `connect-pg-simple` for PostgreSQL-based sessions (though session implementation is not yet active)

**Build Process**: 
- Development: tsx for running TypeScript directly
- Production: esbuild bundles server code, Vite bundles client code

### Data Storage

**Client-Side Storage**: localStorage for all user data persistence
- Bank total (in cents)
- Deposit history array
- User preferences (theme, music, quote interval, auto-deposit setting)
- Favorited quotes

**Schema Validation**: Zod schemas define all data structures with TypeScript type inference

**Data Models**:
- `AppState`: Top-level persistent state
- `DepositHistory`: Individual focus session records
- `Preferences`: User settings
- Session state (idle/running/paused/depositing) stored in memory only

**Database**: 
- Drizzle ORM configured for PostgreSQL via Neon serverless driver
- Schema defined in `shared/schema.ts`
- Migration support via drizzle-kit
- Currently no active database operations; user schema exists as placeholder

### Audio System

**Implementation**: Web Audio API service (`audioService.ts`)
- Three music packs: LoFi (220Hz sine wave), 528Hz (healing frequency), Waves (pink noise)
- Low volume (0.05) ambient background audio
- Play/pause/stop controls
- AudioContext management with proper initialization and state handling

### Core Features

**Focus Timer**: 
- **Exponential Earnings Growth**: Base rate of 5 cents per second (`EARN_RATE_CENTS_PER_SEC = 5`) multiplied by exponential growth factor
- **Multiplier Formula**: `Math.pow(1.02, seconds / 30)` capped at 4x maximum
  - Starts at 1x (5¢/sec)
  - Reaches ~1.14x at 5 minutes (5.7¢/sec)
  - Reaches ~1.31x at 10 minutes (6.55¢/sec)
  - Caps at 4x around 20 minutes (20¢/sec)
- **Fractional Cents Tracking**: Uses ref-based accumulator to prevent rounding errors, resets on deposit
- **Focus Multiplier Progress Bar**: Visual indicator showing current multiplier (1x → 4x) with milestone markers at 2x and 3x
- Session states: idle, running, paused, depositing
- Real-time counter with animated transitions
- Context-aware main button: "Manifest" when idle, "Deposit" during sessions

**Quote Rotation**: 
- Array of starter affirmations
- Configurable rotation interval (default 15 seconds)
- Favorite/unfavorite functionality

**Deposit System**:
- Confirmation modal before banking session earnings
- Automatic history creation with timestamp, duration, amount, and label
- Animated counter transitions during deposit

**Bank/History View**:
- Lifetime total display with shimmer animation
- Chronological list of all deposits
- Formatted timestamps (Today, Yesterday, or date)
- Duration and amount per entry

**Settings**:
- Theme selection (4 options with live preview)
- Music pack selection (3 options)
- Quote rotation interval configuration
- Auto-deposit on exit toggle
- Full app reset with confirmation dialog

### External Dependencies

**UI Components**: 
- @radix-ui/* - Headless accessible component primitives
- shadcn/ui - Pre-built component library
- class-variance-authority - Component variant styling
- tailwindcss - Utility-first CSS framework

**State & Data**:
- @tanstack/react-query - Server state management (configured but minimal usage)
- zod - Runtime type validation
- drizzle-orm - TypeScript ORM
- drizzle-zod - Zod schema generation from Drizzle

**Database**:
- @neondatabase/serverless - PostgreSQL connection
- connect-pg-simple - PostgreSQL session store

**Forms**: 
- react-hook-form - Form state management
- @hookform/resolvers - Validation resolver utilities

**Utilities**:
- date-fns - Date formatting and manipulation
- clsx + tailwind-merge (via cn utility) - Class name merging
- lucide-react - Icon library
- nanoid - Unique ID generation

**Build Tools**:
- vite - Frontend build tool and dev server
- esbuild - Fast JavaScript bundler for server
- tsx - TypeScript execution for development
- typescript - Type checking

**Development**:
- @replit/* plugins - Replit-specific integrations (cartographer, error overlay, dev banner)