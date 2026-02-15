# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Rules

### Language
- Chat with user: ALWAYS in Polish
- Code: ALWAYS in English
- Code comments: ALWAYS in English
- Variable/function names: ALWAYS in English (camelCase)
- Commit messages: in English

### Code Changes
- Always provide code snippets in chat, never regenerate entire files (unless creating a new file)
- Clearly indicate where to edit: specify exactly before/after which existing code fragment to insert new code

### Emoji
- Do NOT use emoji in code (allowed only in markdown docs)

### Confidence Threshold
- >= 95% confidence → proceed with work
- < 95% confidence → STOP and ask the user for clarification
- Never assume — always verify
- Do not start work if something is unclear
- Better to ask 3 times than get it wrong once

## Project Overview

TapTrap is a React Native mobile game built with Expo. It's a reaction/memory puzzle game with progressive difficulty — players follow instructions like "tap once", "don't tap", "remember this number", etc., under time pressure.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on Web
```

No test framework or linter is configured.

## Architecture

### Entry Flow
`index.ts` → `App.tsx` → `src/screens/GameScreen.tsx` (single-screen app, settings shown as modal overlay)

### Key Directories
- **src/engine/** — Pure game logic: rule validation, level generation, difficulty scaling, scoring. No UI dependencies.
- **src/hooks/** — `useGameLoop.ts` is the core game orchestrator managing timer, state transitions, lives, and score.
- **src/components/game/** — Reusable game UI: `TapZone` (interactive circle with SVG ring + animations), `ScoreBar`, `Instruction`, `AmbientBackground`.
- **src/screens/** — `GameScreen.tsx` (main UI, renders different views per game state) and `SettingsScreen.tsx` (modal).
- **src/store/** — Zustand store for user settings, persisted to AsyncStorage.
- **src/constants/** — Colors, fonts, timing values.

### Game Engine (src/engine/)
- **10 rule types** defined in `types.ts`: `tap_once`, `tap_n_times`, `dont_tap`, `double_tap`, `tap_and_hold` (placeholder), `remember_number`, `recall_number`, `remember_icon`, `recall_icon`, `opposite`
- **`rules.ts`** — `validateAction()` pure function checks if player action satisfies the current rule
- **`levels.ts`** — `generateLevel()` picks from 14 level templates, filtered by difficulty tier
- **`difficulty.ts`** — 5 tiers with decreasing time limits (4000ms→1500ms) and progressively unlocked rule types
- **`scoring.ts`** — Base 100pts + combo bonus (50/level) + time bonus (0-50pts)

### State Management
- **Game state**: React hooks in `useGameLoop.ts` (useState + setInterval timer at 100ms tick)
- **Settings**: Zustand store with AsyncStorage persistence (`settingsStore.ts`)
- **High score**: Stored directly in AsyncStorage under key `highScore`
- **Game states**: `idle` → `playing` → `level_complete`/`failed` → `game_over`
- **3-life system**: Lives reset each game, combo resets on failure

### UI & Animation
- All animations use React Native `Animated` API (no external animation library)
- `TapZone` uses `react-native-svg` for the countdown ring with glow layers
- Color theme is dark (#08080f background, #00ff88 accent, #ff3355 danger)
- Font: JetBrainsMono (Light/Regular/Bold) loaded via expo-font
- Components use `React.memo` to prevent unnecessary rerenders

## Tech Stack
- React 19 + React Native 0.81 + Expo 54
- TypeScript (strict mode)
- Zustand for settings state
- AsyncStorage for persistence
- expo-haptics for vibration feedback (disabled on web)

## Notes
- Audio system (`useSound.ts`) is fully coded but commented out; sound asset files are missing
- `tap_and_hold` rule type has placeholder validation (not fully implemented)
- `src/utils/` directory exists but is empty
- App is portrait-only, Android edge-to-edge enabled
