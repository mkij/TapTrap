import { Level, ScreenType, RuleParams } from "./types";
import { adjustTimeForPerformance, shouldRescue, PerformanceContext } from "./difficulty";

// --- Stage level definition (what you write as designer) ---

export interface StageLevelDef {
  instruction: string;
  rule: string;
  screenType?: ScreenType;
  timeLimit?: number;
  difficulty?: 1 | 2 | 3;
  params?: RuleParams;
  requiresMemory?: boolean;
  requiresPrevious?: boolean;
  requiresDevice?: boolean;
}

export interface Stage {
  name: string;
  levels: StageLevelDef[];
}

// --- Helper to resolve dynamic params (reused from levels.ts logic) ---

const ICONS = ["bird", "star", "heart", "moon", "fire", "leaf"];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveStageParams(
  def: StageLevelDef,
  rememberedIcon: string | null
): { params: RuleParams; instruction: string } {
  const params: RuleParams = { ...def.params };
  let instruction = def.instruction;

  if (def.rule === "remember_number" && !params.rememberValue) {
    params.rememberValue = getRandomInt(2, 7);
  }

  if (def.rule === "remember_icon" && !params.rememberIcon) {
    params.rememberIcon = pickRandom(ICONS);
  }

  if (def.rule === "recall_icon") {
    if (!params.targetIcon) {
      const showCorrect = Math.random() > 0.4;
      params.targetIcon = showCorrect
        ? (rememberedIcon || "star")
        : pickRandom(ICONS.filter((i) => i !== rememberedIcon));
    }
  }

  if (def.rule === "stroop" && !params.stroopText) {
    const colors = ["red", "green", "blue", "yellow", "purple", "orange"];
    const textColor = pickRandom(colors);
    const inkColor = pickRandom(colors.filter((c) => c !== textColor));
    const matchType = pickRandom(["color", "word"] as const);
    const target = pickRandom(colors);
    params.stroopText = textColor;
    params.stroopColor = inkColor;
    params.matchType = matchType;
    params.target = target;
    params.shouldTap = matchType === "color" ? inkColor === target : textColor === target;
  }

  if (def.rule === "math_tap" && !params.expression) {
    const ops = [
      { a: 2, b: 2, op: "+", answer: 4 },
      { a: 3, b: 1, op: "+", answer: 4 },
      { a: 5, b: 2, op: "-", answer: 3 },
      { a: 3, b: 2, op: "+", answer: 5 },
      { a: 2, b: 3, op: "x", answer: 6 },
      { a: 4, b: 1, op: "+", answer: 5 },
      { a: 6, b: 3, op: "-", answer: 3 },
    ];
    const chosen = pickRandom(ops);
    params.expression = `${chosen.a}${chosen.op}${chosen.b}`;
    params.answer = chosen.answer;
    params.displayed = chosen.answer + pickRandom([-2, -1, 1, 2]);
  }

  // Resolve placeholders
  for (const [key, value] of Object.entries(params)) {
    instruction = instruction.replace(`{${key}}`, String(value));
  }

  return { params, instruction };
}

// --- Convert stage level def to Level ---

export function buildLevelFromStage(
  def: StageLevelDef,
  levelNumber: number,
  rememberedIcon: string | null,
  performance?: PerformanceContext
): Level {
  const { params, instruction } = resolveStageParams(def, rememberedIcon);
  const baseTime = (def.timeLimit ?? 4.0) * 1000;
  const adjustedTime = adjustTimeForPerformance(baseTime, performance);

  if (performance) {
    console.log(`[DIFFICULTY] base=${baseTime}ms → adjusted=${adjustedTime}ms | combo=${performance.combo} errors=${performance.recentErrors}/5`);
  }

  return {
    id: levelNumber,
    instruction,
    rule: def.rule,
    params,
    timeLimit: adjustedTime,
    screenType: def.screenType ?? "standard",
    difficulty: def.difficulty ?? 1,
    requiresMemory: def.requiresMemory,
    requiresPrevious: def.requiresPrevious,
    requiresDevice: def.requiresDevice,
  };
}

// --- Stage definitions ---

export const STAGES: Stage[] = [
  {
    name: "The Basics",
    levels: [
      { instruction: "Tap once", rule: "tap_once", timeLimit: 4.0, difficulty: 1 },
      { instruction: "Tap once", rule: "tap_once", timeLimit: 4.0, difficulty: 1 },
      { instruction: "Don't tap!", rule: "dont_tap", timeLimit: 4.0, difficulty: 1 },
      { instruction: "Tap 2 times", rule: "tap_n_times", params: { count: 2 }, timeLimit: 5.0, difficulty: 1 },
      { instruction: "Tap once", rule: "tap_once", timeLimit: 3.5, difficulty: 1 },
    ],
  },
  {
    name: "Getting Tricky",
    levels: [
      { instruction: "Double tap", rule: "double_tap", timeLimit: 3.0, difficulty: 1 },
      { instruction: "Don't tap!", rule: "dont_tap", timeLimit: 4.0, difficulty: 1 },
      { instruction: "Tap 3 times", rule: "tap_n_times", params: { count: 3 }, timeLimit: 5.0, difficulty: 1 },
      { instruction: "Wait...", rule: "dont_tap", timeLimit: 4.0, difficulty: 1 },
      { instruction: "Tap once", rule: "tap_once", timeLimit: 3.0, difficulty: 1 },
    ],
  },
  {
    name: "Opposites",
    levels: [
      { instruction: "Tap 4 times", rule: "tap_n_times", params: { count: 4 }, timeLimit: 5.0, difficulty: 1 },
      { instruction: "Do the opposite", rule: "opposite", params: { count: 0 }, timeLimit: 4.0, difficulty: 2 },
      { instruction: "Double tap", rule: "double_tap", timeLimit: 3.0, difficulty: 1 },
      { instruction: "Do the opposite", rule: "opposite", params: { count: 1 }, timeLimit: 4.0, difficulty: 2 },
      { instruction: "Don't tap!", rule: "dont_tap", timeLimit: 3.5, difficulty: 1 },
    ],
  },
  {
    name: "Memory",
    levels: [
      { instruction: "Remember: {rememberValue}", rule: "remember_number", screenType: "number_display", timeLimit: 4.0, difficulty: 1, requiresMemory: true },
      { instruction: "How many was it?", rule: "recall_number", timeLimit: 5.0, difficulty: 2, requiresMemory: true, requiresPrevious: true },
      { instruction: "Tap once", rule: "tap_once", timeLimit: 3.0, difficulty: 1 },
      { instruction: "Remember: {rememberIcon}", rule: "remember_icon", screenType: "icon_display", timeLimit: 4.0, difficulty: 1, requiresMemory: true },
      { instruction: "Tap if: {targetIcon}", rule: "recall_icon", screenType: "icon_match", timeLimit: 4.0, difficulty: 2, requiresMemory: true, requiresPrevious: true },
    ],
  },
  {
    name: "Mind Games",
    levels: [
      { instruction: "This level is easy", rule: "dont_tap", timeLimit: 2.5, difficulty: 3 },
      { instruction: "Same as last time", rule: "repeat_previous", timeLimit: 4.0, difficulty: 2, requiresMemory: true, requiresPrevious: true },
      { instruction: "Tap once", rule: "visual_glitch", screenType: "glitch_screen", timeLimit: 5.0, difficulty: 2 },
      { instruction: "Do the opposite", rule: "opposite", params: { count: 0 }, timeLimit: 3.5, difficulty: 2 },
      { instruction: "I know you're spamming", rule: "dont_tap", timeLimit: 4.0, difficulty: 2 },
    ],
  },
  {
    name: "Surprise",
    levels: [
      { instruction: "Tap 3 times", rule: "tap_n_times", params: { count: 3 }, timeLimit: 4.0, difficulty: 1 },
      { instruction: "", rule: "fake_crash", screenType: "crash_screen", timeLimit: 6.0, difficulty: 2 },
      { instruction: "Don't tap!", rule: "dont_tap", screenType: "upside_down", timeLimit: 5.0, difficulty: 2 },
      { instruction: "Patience is a key", rule: "dont_tap", timeLimit: 8.0, difficulty: 2 },
      { instruction: "Stroop test", rule: "stroop", screenType: "stroop_display", timeLimit: 4.0, difficulty: 3 },
    ],
  },
];

// --- Helpers ---

// Flatten all stages into sequential level list
function flattenStages(): StageLevelDef[] {
  return STAGES.flatMap((s) => s.levels);
}

const ALL_STAGE_LEVELS = flattenStages();

export function getTotalStageLevels(): number {
  return ALL_STAGE_LEVELS.length;
}

export function getStageLevelDef(levelNumber: number): StageLevelDef | null {
  const index = levelNumber - 1;
  if (index < 0 || index >= ALL_STAGE_LEVELS.length) return null;
  return ALL_STAGE_LEVELS[index];
}

// Get stage name for a level rt { Level, ScreenType, RuleParams } from "./ty
export function getStageName(levelNumber: number): string | null {
  let count = 0;
  for (const stage of STAGES) {
    count += stage.levels.length;
    if (levelNumber <= count) return stage.name;
  }
  return null;
}