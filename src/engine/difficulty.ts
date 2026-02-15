import { Category } from "./types";

export interface DifficultyConfig {
  baseTime: number;
  allowedCategories: Category[];
  maxDifficulty: 1 | 2 | 3;
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