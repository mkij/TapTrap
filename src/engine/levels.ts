import { Level, RuleType } from "./types";
import { getDifficultyConfig } from "./difficulty";

interface LevelTemplate {
  instruction: string;
  rule: RuleType;
  params: Record<string, unknown>;
  deceptive?: boolean;
  requiresMemory?: boolean;
  requiresOpposite?: boolean;
}

const ICONS = ["bird", "star", "heart", "moon", "fire", "leaf"];

const LEVEL_POOL: LevelTemplate[] = [
  // Layer 1: Reaction basics
  { instruction: "Tap once", rule: "tap_once", params: {} },
  { instruction: "Tap 2 times", rule: "tap_n_times", params: { count: 2 } },
  { instruction: "Tap 3 times", rule: "tap_n_times", params: { count: 3 } },
  { instruction: "Tap 4 times", rule: "tap_n_times", params: { count: 4 } },
  { instruction: "Tap 5 times", rule: "tap_n_times", params: { count: 5 } },
  { instruction: "Don't tap!", rule: "dont_tap", params: {} },
  { instruction: "Wait...", rule: "dont_tap", params: {} },
  { instruction: "Double tap", rule: "double_tap", params: {} },

  // Layer 3: Memory
  {
    instruction: "Remember this number",
    rule: "remember_number",
    params: {},
    requiresMemory: true,
  },
  {
    instruction: "How many was it?",
    rule: "recall_number",
    params: {},
    requiresMemory: true,
  },
  {
    instruction: "Remember this icon",
    rule: "remember_icon",
    params: {},
    requiresMemory: true,
  },
  {
    instruction: "Tap only if you see it",
    rule: "recall_icon",
    params: {},
    requiresMemory: true,
  },

  // Layer 4: Opposite
  {
    instruction: "Do the opposite",
    rule: "opposite",
    params: { count: 0 },
    requiresOpposite: true,
  },
  {
    instruction: "Do the opposite",
    rule: "opposite",
    params: { count: 1 },
    requiresOpposite: true,
  },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateLevel(levelNumber: number): Level {
  const difficulty = getDifficultyConfig(levelNumber);

  // Filter pool based on difficulty
  const available = LEVEL_POOL.filter((template) => {
    if (template.deceptive && !difficulty.allowDeceptive) return false;
    if (template.requiresMemory && !difficulty.allowMemory) return false;
    if (template.requiresOpposite && !difficulty.allowOpposite) return false;
    return true;
  });

  const template = pickRandom(available);
  const params = { ...template.params };

  // Fill dynamic params
  if (template.rule === "remember_number") {
    params.rememberValue = getRandomInt(2, 7);
  }

  if (template.rule === "remember_icon") {
    params.rememberIcon = pickRandom(ICONS);
  }

  if (template.rule === "recall_icon") {
    const showCorrect = Math.random() > 0.4;
    if (showCorrect) {
      params.targetIcon = "REMEMBERED";
    } else {
      params.targetIcon = pickRandom(
        ICONS.filter((i) => i !== "REMEMBERED")
      );
    }
  }

  let instruction = template.instruction;

  if (template.rule === "remember_number" && params.rememberValue) {
    instruction = `Remember: ${params.rememberValue}`;
  }

  if (template.rule === "remember_icon" && params.rememberIcon) {
    instruction = `Remember: ${params.rememberIcon}`;
  }

  return {
    id: levelNumber,
    instruction,
    rule: template.rule,
    params,
    timeLimit: difficulty.baseTime,
    deceptive: template.deceptive,
  };
}