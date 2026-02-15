import { Level, LevelTemplate } from "./types";
import { getDifficultyConfig } from "./difficulty";

const ICONS = ["bird", "star", "heart", "moon", "fire", "leaf"];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Level catalog ---

const LEVEL_CATALOG: LevelTemplate[] = [
  // === BASIC ===
  {
    id: "B01",
    instruction: "Tap once",
    rule: "tap_once",
    params: {},
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 4.0,
  },
  {
    id: "B02",
    instruction: "Tap {count} times",
    rule: "tap_n_times",
    params: { count: 2 },
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "B03",
    instruction: "Tap {count} times",
    rule: "tap_n_times",
    params: { count: 3 },
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "B04",
    instruction: "Tap {count} times",
    rule: "tap_n_times",
    params: { count: 4 },
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "B05",
    instruction: "Tap {count} times",
    rule: "tap_n_times",
    params: { count: 5 },
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "B06",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: {},
    category: "basic",
    subCategory: "wait",
    screenType: "standard",
    inputType: "none",
    difficulty: 1,
    timeLimit: 4.0,
  },
  {
    id: "B07",
    instruction: "Wait...",
    rule: "dont_tap",
    params: {},
    category: "basic",
    subCategory: "wait",
    screenType: "standard",
    inputType: "none",
    difficulty: 1,
    timeLimit: 4.0,
  },
  {
    id: "B08",
    instruction: "Double tap",
    rule: "double_tap",
    params: {},
    category: "basic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 3.0,
  },

  // === OPPOSITE ===
  {
    id: "O01",
    instruction: "Do the opposite",
    rule: "opposite",
    params: { count: 0 },
    category: "opposite",
    screenType: "standard",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "O02",
    instruction: "Do the opposite",
    rule: "opposite",
    params: { count: 1 },
    category: "opposite",
    screenType: "standard",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
  },

  // === MEMORY ===
  {
    id: "M01",
    instruction: "Remember: {rememberValue}",
    rule: "remember_number",
    params: {},
    category: "memory",
    subCategory: "store",
    screenType: "number_display",
    inputType: "none",
    difficulty: 1,
    timeLimit: 4.0,
    requiresMemory: true,
  },
  {
    id: "M02",
    instruction: "How many was it?",
    rule: "recall_number",
    params: {},
    category: "memory",
    subCategory: "recall",
    screenType: "standard",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
    requiresMemory: true,
    requiresPrevious: true,
  },
  {
    id: "M03",
    instruction: "Remember: {rememberIcon}",
    rule: "remember_icon",
    params: {},
    category: "memory",
    subCategory: "store",
    screenType: "icon_display",
    inputType: "none",
    difficulty: 1,
    timeLimit: 4.0,
    requiresMemory: true,
  },
  {
    id: "M04",
    instruction: "Tap if: {targetIcon}",
    rule: "recall_icon",
    params: {},
    category: "memory",
    subCategory: "recall",
    screenType: "icon_match",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
    requiresMemory: true,
    requiresPrevious: true,
  },
  // === TIME ===
  {
    id: "T05",
    instruction: "Patience...",
    rule: "dont_tap",
    params: {},
    category: "time",
    subCategory: "wait",
    screenType: "standard",
    inputType: "none",
    difficulty: 2,
    timeLimit: 8.0,
  },
  {
    id: "T05b",
    instruction: "Patience is a key",
    rule: "dont_tap",
    params: {},
    category: "time",
    subCategory: "wait",
    screenType: "standard",
    inputType: "none",
    difficulty: 2,
    timeLimit: 10.0,
  },

  // === MATH ===
  {
    id: "MA01",
    instruction: "Tap the answer: {expression} = {displayed}",
    rule: "math_tap",
    params: {},
    category: "math",
    subCategory: "arithmetic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 6.0,
  },
  {
    id: "MA02",
    instruction: "How much is {expression}?",
    rule: "math_tap",
    params: {},
    category: "math",
    subCategory: "arithmetic",
    screenType: "standard",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 6.0,
  },

  // === META ===
  {
    id: "ME01",
    instruction: "Stop reading this and tap. Seriously, why are you still reading? Just tap the circle. NOW.",
    rule: "tap_once",
    params: {},
    category: "meta",
    subCategory: "urgency",
    screenType: "standard",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "ME02",
    instruction: "I know you're spamming",
    rule: "dont_tap",
    params: {},
    category: "meta",
    subCategory: "awareness",
    screenType: "standard",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "ME03",
    instruction: "This level is easy",
    rule: "dont_tap",
    params: {},
    category: "meta",
    subCategory: "deception",
    screenType: "standard",
    inputType: "none",
    difficulty: 3,
    timeLimit: 2.0,
  },
  {
    id: "ME05",
    instruction: "Tap if you need a break",
    rule: "tap_once",
    params: {},
    category: "meta",
    subCategory: "emotional",
    screenType: "standard",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 8.0,
  },

  // === MEMORY: repeat previous ===
  {
    id: "M05",
    instruction: "Same as last time",
    rule: "repeat_previous",
    params: {},
    category: "memory",
    subCategory: "recall",
    screenType: "standard",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
    requiresMemory: true,
    requiresPrevious: true,
  },
  {
    id: "M05b",
    instruction: "Repeat!",
    rule: "repeat_previous",
    params: {},
    category: "memory",
    subCategory: "recall",
    screenType: "standard",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 3.0,
    requiresMemory: true,
    requiresPrevious: true,
  },

  // === CONFLICT: prewarning ===
  {
    id: "C04",
    instruction: "Next screen is a lie",
    rule: "prewarning",
    params: {},
    category: "conflict",
    subCategory: "prewarning",
    screenType: "standard",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  // === PERCEPTION: Stroop ===
  {
    id: "P09",
    instruction: "Stroop test",
    rule: "stroop",
    params: {},
    category: "perception",
    subCategory: "stroop",
    screenType: "stroop_display",
    inputType: "conditional",
    difficulty: 3,
    timeLimit: 4.0,
  },
  {
    id: "P09b",
    instruction: "Stroop test",
    rule: "stroop",
    params: {},
    category: "perception",
    subCategory: "stroop",
    screenType: "stroop_display",
    inputType: "conditional",
    difficulty: 3,
    timeLimit: 3.0,
  },

  // === PERCEPTION: Upside down ===
  {
    id: "P07",
    instruction: "Tap once",
    rule: "tap_once",
    params: {},
    category: "perception",
    subCategory: "orientation",
    screenType: "upside_down",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "P07b",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: {},
    category: "perception",
    subCategory: "orientation",
    screenType: "upside_down",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },

  // === SURPRISE: Glitch ===
  {
    id: "S01",
    instruction: "Tap once",
    rule: "visual_glitch",
    params: {},
    category: "surprise",
    subCategory: "glitch",
    screenType: "glitch_screen",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "S01b",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: {},
    category: "surprise",
    subCategory: "glitch",
    screenType: "glitch_screen",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },

  // === SURPRISE: Fake crash ===
  {
    id: "S02",
    instruction: "",
    rule: "fake_crash",
    params: {},
    category: "surprise",
    subCategory: "crash",
    screenType: "crash_screen",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 6.0,
  },
  // === TIME: Hold ===
  {
    id: "T06",
    instruction: "Hold!",
    rule: "tap_and_hold",
    params: { holdDuration: 2.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 2,
    timeLimit: 6.0,
  },
  {
    id: "T06b",
    instruction: "Hold it!",
    rule: "tap_and_hold",
    params: { holdDuration: 1.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 1,
    timeLimit: 4.0,
  },
  {
    id: "T06c",
    instruction: "Hold steady...",
    rule: "tap_and_hold",
    params: { holdDuration: 3.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 3,
    timeLimit: 6.0,
  },
  // === TIME: Hold timed variants ===
  {
    id: "T07",
    instruction: "Hold for exactly 2s",
    rule: "hold_timed",
    params: { holdDuration: 4, holdMode: "exact", targetSec: 2.0, tolerance: 0.4 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 2,
    timeLimit: 6.0,
  },
  {
    id: "T07b",
    instruction: "Hold for exactly 3s",
    rule: "hold_timed",
    params: { holdDuration: 5, holdMode: "exact", targetSec: 3.0, tolerance: 0.3 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 3,
    timeLimit: 7.0,
  },
  {
    id: "T08",
    instruction: "Hold at least 1.5s",
    rule: "hold_timed",
    params: { holdDuration: 4, holdMode: "min", targetSec: 1.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 1,
    timeLimit: 6.0,
  },
  {
    id: "T08b",
    instruction: "Hold at least 2.5s",
    rule: "hold_timed",
    params: { holdDuration: 5, holdMode: "min", targetSec: 2.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 2,
    timeLimit: 7.0,
  },
  {
    id: "T09",
    instruction: "Release before 1s!",
    rule: "hold_timed",
    params: { holdDuration: 3, holdMode: "max", targetSec: 1.0 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "T09b",
    instruction: "Release before 0.5s!",
    rule: "hold_timed",
    params: { holdDuration: 2, holdMode: "max", targetSec: 0.5 },
    category: "time",
    subCategory: "hold",
    screenType: "hold_timer",
    inputType: "hold",
    difficulty: 3,
    timeLimit: 3.0,
  },
];

// --- Dynamic param resolution ---

function resolveParams(
  template: LevelTemplate,
  rememberedIcon: string | null
): { params: Record<string, unknown>; instruction: string } {
  const params: Record<string, unknown> = { ...template.params };
  let instruction = template.instruction;

  // Remember number: generate random value
  if (template.rule === "remember_number") {
    params.rememberValue = getRandomInt(2, 7);
  }

  // Remember icon: pick random icon
  if (template.rule === "remember_icon") {
    params.rememberIcon = pickRandom(ICONS);
  }

  // Recall icon: decide if showing correct or decoy
  if (template.rule === "recall_icon") {
    const showCorrect = Math.random() > 0.4;
    if (showCorrect) {
      params.targetIcon = rememberedIcon || "star";
    } else {
      params.targetIcon = pickRandom(
        ICONS.filter((i) => i !== rememberedIcon)
      );
    }
  }

  // Stroop: generate random color/word combo
  if (template.rule === "stroop" && !params.stroopText) {
    const colors = ["red", "green", "blue", "yellow", "purple", "orange"];
    const textColor = pickRandom(colors);
    const inkColor = pickRandom(colors.filter((c) => c !== textColor));
    const matchType = pickRandom(["color", "word"] as const);
    const target = pickRandom(colors);

    params.stroopText = textColor;
    params.stroopColor = inkColor;
    params.matchType = matchType;
    params.target = target;

    // Determine correct answer
    const match = matchType === "color" ? inkColor === target : textColor === target;
    params.shouldTap = match;
  }

  // Resolve instruction placeholders
  // Math: generate random expression
  if (template.rule === "math_tap" && !params.expression) {
    const ops = [
      { a: 2, b: 2, op: "+", answer: 4 },
      { a: 3, b: 1, op: "+", answer: 4 },
      { a: 5, b: 2, op: "-", answer: 3 },
      { a: 3, b: 2, op: "+", answer: 5 },
      { a: 2, b: 3, op: "x", answer: 6 },
      { a: 4, b: 1, op: "+", answer: 5 },
      { a: 6, b: 3, op: "-", answer: 3 },
      { a: 2, b: 1, op: "+", answer: 3 },
      { a: 3, b: 3, op: "x", answer: 9 },
      { a: 7, b: 4, op: "-", answer: 3 },
    ];
    const chosen = pickRandom(ops);
    params.expression = `${chosen.a}${chosen.op}${chosen.b}`;
    params.answer = chosen.answer;
    // Displayed value is intentionally wrong
    params.displayed = chosen.answer + pickRandom([-2, -1, 1, 2]);
  }

  // Resolve instruction placeholders
  for (const [key, value] of Object.entries(params)) {
    instruction = instruction.replace(`{${key}}`, String(value));
  }

  return { params, instruction };
}

// --- Level generator ---

export function generateLevel(
  levelNumber: number,
  context?: {
    rememberedIcon?: string | null;
    recentRules?: string[];
    recentCategories?: string[];
  }
): Level {
  const difficulty = getDifficultyConfig(levelNumber);

  // Filter catalog by allowed categories and max difficulty
  const available = LEVEL_CATALOG.filter((t) => {
    if (!difficulty.allowedCategories.includes(t.category)) return false;
    if (t.difficulty > difficulty.maxDifficulty) return false;
    return true;
  });

  // Anti-repeat: avoid same rule/category as recent levels
  const recentRules = context?.recentRules ?? [];
  const recentCategories = context?.recentCategories ?? [];

  let pool = available;

  // Tier 1: avoid same rule as last 2 levels AND same category as last level
  let filtered = pool.filter((t) => {
    if (recentRules.length > 0 && recentRules.slice(-2).includes(t.rule)) return false;
    if (recentCategories.length > 0 && recentCategories[recentCategories.length - 1] === t.category) return false;
    return true;
  });

  // Tier 2 fallback: only avoid same rule as last level
  if (filtered.length === 0) {
    filtered = pool.filter((t) => {
      if (recentRules.length > 0 && recentRules[recentRules.length - 1] === t.rule) return false;
      return true;
    });
  }

  // Tier 3 fallback: use full pool (no restrictions)
  if (filtered.length > 0) {
    pool = filtered;
  }

  const template = pickRandom(pool);

  const { params, instruction } = resolveParams(
    template,
    context?.rememberedIcon ?? null
  );

  return {
    id: levelNumber,
    instruction,
    rule: template.rule,
    params,
    timeLimit: difficulty.baseTime,
    category: template.category,
    subCategory: template.subCategory,
    screenType: template.screenType,
    inputType: template.inputType,
    difficulty: template.difficulty,
    requiresMemory: template.requiresMemory,
    requiresPrevious: template.requiresPrevious,
    requiresDevice: template.requiresDevice,
  };
}

// Export for external use
export { LEVEL_CATALOG, ICONS };