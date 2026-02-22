import { Category } from "./types";

export interface DifficultyConfig {
  baseTime: number;
  allowedCategories: Category[];
  maxDifficulty: 1 | 2 | 3;
}

export interface PerformanceContext {
  combo: number;
  recentErrors: number;   // errors in last 5 levels
  totalLevels: number;
  chapterId: number | null;
  gameMode: "chapter" | "endless" | "hardcore";
}

// Chapter-based intensity: ch1=0, ch2=0.26, ch3=0.63, ch4+=1.0, endless=1.0
function getDifficultyIntensity(chapterId: number | null): number {
  if (chapterId === null) return 1.0;
  return Math.min(1, ((chapterId - 1) / 3) ** 1.3);
}

// Dynamic time adjustment based on player performance
export function adjustTimeForPerformance(
  baseTime: number,
  perf: PerformanceContext | undefined
): number {
  if (!perf) return baseTime;

  const intensity = getDifficultyIntensity(perf.chapterId);

  // No dynamic difficulty at intensity 0 (chapter 1)
  if (intensity === 0) return baseTime;

  let adjustment = 0;

  // Player is doing well: shorten time
  if (perf.combo > 0) {
    adjustment -= perf.combo * 40;
    adjustment -= Math.floor(perf.combo / 5) * 80;
  }

  // Player struggling: add rescue time
  if (perf.recentErrors >= 2) {
    adjustment += 300;
  }

  // Scale adjustment by intensity
  const time = baseTime + adjustment * intensity;

  // Clamp: never below 1400ms, never above baseTime + 500ms
  return Math.max(1400, Math.min(time, baseTime + 500));
}

// Should this level be a simple/easy one? (rescue mechanic)
export function shouldRescue(perf: PerformanceContext | undefined): boolean {
  if (!perf) return false;
  return perf.recentErrors >= 2;
}

export function getDifficultyConfig(levelNumber: number): DifficultyConfig {
  // Tier 1: levels 1-5 — basics only
  if (levelNumber <= 5) {
    return {
      baseTime: 4000,
      allowedCategories: ["basic"],
      maxDifficulty: 1,
    };
  }

  // Tier 2: levels 6-10 — add opposite
  if (levelNumber <= 10) {
    return {
      baseTime: 3500,
      allowedCategories: ["basic", "opposite"],
      maxDifficulty: 1,
    };
  }

  // Tier 3: levels 11-15 — add perception, time, surprise
  if (levelNumber <= 15) {
    return {
      baseTime: 3500,
      allowedCategories: ["basic", "opposite", "perception", "time", "surprise"],
      maxDifficulty: 2,
    };
  }

  // Tier 4: levels 16-20 — add memory, math, device
  if (levelNumber <= 20) {
    return {
      baseTime: 3000,
      allowedCategories: [
        "basic", "opposite", "perception", "time",
        "surprise", "memory", "math", "device",
      ],
      maxDifficulty: 2,
    };
  }

  // Tier 5: levels 21-30 — add meta, habit, conflict
  if (levelNumber <= 30) {
    return {
      baseTime: 2500,
      allowedCategories: [
        "basic", "opposite", "perception", "time",
        "surprise", "memory", "math", "device",
        "meta", "habit", "conflict",
      ],
      maxDifficulty: 2,
    };
  }

  // Tier 6: levels 31-40 — all categories, hard unlocked
  if (levelNumber <= 40) {
    return {
      baseTime: 2500,
      allowedCategories: [
        "basic", "opposite", "perception", "time",
        "surprise", "memory", "math", "device",
        "meta", "habit", "conflict", "cumulative",
      ],
      maxDifficulty: 3,
    };
  }

  // Tier 7: 40+ chaos mode — all categories, shrinking time
  return {
    baseTime: Math.max(1500, 2500 - (levelNumber - 40) * 25),
    allowedCategories: [
      "basic", "opposite", "perception", "time",
      "surprise", "memory", "math", "device",
      "meta", "habit", "conflict", "cumulative",
    ],
    maxDifficulty: 3,
  };
}