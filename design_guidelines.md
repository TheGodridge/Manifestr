# Manifestr Design Guidelines

## Design Approach
Reference-based approach drawing from premium meditation apps (Calm, Headspace) with gamification elements similar to Duolingo's streak system, combined with cosmic/ambient aesthetics.

## Color Palette
- **Night Sky (Background)**: #0A0D2A
- **Aurora Purple (Accents/Glow)**: #3B0A66
- **Pulse Purple (Pressed/Active)**: #5C318F
- **Gold Primary (Counter/CTAs)**: #F8D94E
- **Soft Gold (Subtext/Icons)**: #EBD46A
- **Mist Lavender (Secondary Text)**: #C7BAF0
- **White (High Contrast)**: #FFFFFF (sparingly)

## Typography
- **Display Font**: Manrope/Poppins/Inter at 600-700 weight for headline digits
- **Body Font**: Inter/Manrope at 400-500 weight
- **Letter Spacing**: +0.2px on all-caps CTAs
- **Counter Size**: 64-72px on phones, 96px on tablets, weight 700
- **Text Shadow**: Aurora Purple blur 15-20px on counter

## Layout System
**Spacing Scale**: Use Tailwind units of 2, 3, 5, 8, 12, 16, 20, 32, 48
- Screen padding: 20px
- Top quote to counter: 32px
- Counter to subtext: 8px
- Subtext to controls: 48px
- Button gaps: 12px

## Component Library

### Buttons
**Primary (Deposit)**
- Fill: Gold #F8D94E
- Text: Night Sky #0A0D2A
- Border radius: 14px
- Height: 54px
- Shadow: 0 0 30px Aurora Purple at 30% opacity
- Pressed: Darker gold #E0C546, scale 0.98

**Secondary (Play/Pause, Bank)**
- Fill: Aurora Purple #3B0A66
- Text: Gold #F8D94E
- Border: 1px Pulse Purple #5C318F at 20% alpha
- Border radius: 12px
- Height: 50px
- Pressed: Pulse Purple #5C318F, scale 0.98

### Counter Display
- Giant gold digits with Aurora Purple glow
- Smooth tween animation every 1s with easeOutQuad
- Precision: 2 decimal places (e.g., $33.21)

### Affirmation Cards
- Centered, multi-line text
- Rotate every 15s by default
- Right-aligned star icon for favorites
- Mist Lavender color for text

### History List Items
- Amount in gold, bold (e.g., + $33.21)
- Subline in Mist Lavender: "Label · Duration · Timestamp"
- Right chevron for detail view
- Reverse chronological order

## Animations & Motion
**Background**
- Gradient: Top #0A0D2A → Bottom #1A1E3E
- Slow drift (45-60s cycle) with 5% variance
- Radial glow emanating from center

**Particles**
- Gold dots at 10% opacity
- Float upward at 0.2-0.5px/s
- Random easing for organic feel

**Deposit Animation**
- Counter "coin-drop" to zero
- Bank total shimmer effect once
- Success toast with haptic feedback

**Button Press**
- Scale to 0.98 on press
- Color shift as specified per button type
- Light haptic feedback

## Screen Layouts

### Manifest Screen (Home)
Top to bottom:
1. Safe area padding
2. Rotating affirmation (centered, multi-line) with favorite star
3. Counter block (gold digits, centered)
4. Subtext: "Stay present — your energy compounds."
5. Ambient particle animation layer
6. Bottom sticky controls: 🎧 Play/Pause (left), 💰 Deposit (center, primary), 📈 Bank (right)

### Bank Screen
1. Header: "Total Manifested" label with large gold total
2. History list (scrollable)
3. Footer widgets: Streak chip "7-day streak 🔥" + Interest hint
4. Empty state with CTA if no deposits

### Settings Screen
Sections:
- Theme switcher (Galaxy/Ocean/Neon Glow/Minimal)
- Music pack selection
- Session options (quote speed, auto-deposit toggle)
- Data management (reset, export)

## Theme Variants

**Galaxy (Default)**
- BG: #0A0D2A → #1A1E3E
- Particles: Gold + Lavender
- Glow: Aurora Purple

**Ocean**
- BG: #06182E → #0B2C3A
- Accent: Teal #00B3B3
- Particles: Soft aqua

**Neon Glow**
- BG: #0A0D2A → #2A0A26
- Accent: Magenta #FF3BCD
- Particles: Pink-gold

**Minimal**
- BG: Near-black #0B0B0F
- Counter: White
- Accents: Muted gold

## Iconography
Minimal line icons at 24px: Use Material Icons or SF Symbols equivalents for 🎧, 💰, 📈, ⭐, ✨

## Microcopy Examples
- Tagline: "Focus is the new currency."
- Onboarding: "Read. Breathe. Build your balance."
- Deposit toast: "Banked $12.35. Your future self says thanks."
- Empty bank: "Every minute focused is a dollar you keep—start your first deposit."

## Accessibility
- Gold on Night Sky contrast: ≥ 4.5:1 (add subtle text stroke if needed)
- Dynamic type support up to 120%
- VoiceOver labels for all interactive elements
- Haptic feedback: Light tap (play/pause), medium success (deposit)

## Images
No hero images. This is an immersive app experience with cosmic particle effects and gradient backgrounds as the primary visual treatment. All visual impact comes from animated UI elements, glowing typography, and particle systems.