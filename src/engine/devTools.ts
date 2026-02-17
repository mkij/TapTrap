import { Level, Category } from "./types";
import { LEVEL_CATALOG, ICONS } from "./levels";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get all categories that have at least one template in catalog
export function getAvailableCategories(): Category[] {
  const categories = new Set<Category>();
  for (const t of LEVEL_CATALOG) {
    categories.add(t.category);
  }
  return Array.from(categories);
}

// Generate a random level from a specific category
export function generateTestLevel(category: Category): Level {
  const templates = LEVEL_CATALOG.filter((t) => t.category === category);
  if (templates.length === 0) {
    // Fallback to basic
    return generateTestLevel("basic");
  }

  const template = pickRandom(templates);
  const params: Record<string, unknown> = { ...template.params };
  let instruction = template.instruction;

  // Resolve dynamic params
  if (template.rule === "remember_number" && !params.rememberValue) {
    params.rememberValue = getRandomInt(2, 7);
  }
  if (template.rule === "remember_icon" && !params.rememberIcon) {
    params.rememberIcon = pickRandom(ICONS);
  }
  if (template.rule === "recall_icon" && !params.targetIcon) {
    params.targetIcon = pickRandom(ICONS);
  }
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
    params.shouldTap = matchType === "color" ? inkColor === target : textColor === target;
  }
  if (template.rule === "math_tap" && !params.expression) {
    const ops = [
      { a: 2, b: 2, op: "+", answer: 4 },
      { a: 3, b: 1, op: "+", answer: 4 },
      { a: 5, b: 2, op: "-", answer: 3 },
      { a: 3, b: 2, op: "+", answer: 5 },
      { a: 2, b: 3, op: "x", answer: 6 },
    ];
    const chosen = pickRandom(ops);
    params.expression = `${chosen.a}${chosen.op}${chosen.b}`;
    params.answer = chosen.answer;
    params.displayed = chosen.answer + pickRandom([-2, -1, 1, 2]);
  }

  for (const [key, value] of Object.entries(params)) {
    instruction = instruction.replace(`{${key}}`, String(value));
  }

  return {
    id: 999,
    instruction,
    rule: template.rule,
    params,
    timeLimit: (template.timeLimit ?? 4.0) * 1000,
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

// Get available screen types for a category
export function getScreenTypesForCategory(category: Category): { screenType: string; rules: string[]; count: number }[] {
  const templates = LEVEL_CATALOG.filter((t) => t.category === category);
  const screenMap = new Map<string, Set<string>>();

  for (const t of templates) {
    const st = t.screenType;
    if (!screenMap.has(st)) screenMap.set(st, new Set());
    screenMap.get(st)!.add(t.rule);
  }

  return Array.from(screenMap.entries()).map(([screenType, rules]) => ({
    screenType,
    rules: Array.from(rules),
    count: templates.filter((t) => t.screenType === screenType).length,
  }));
}

// Get all templates for a specific category + screenType
export function getTemplatesForScreen(category: Category, screenType: string) {
  return LEVEL_CATALOG.filter(
    (t) => t.category === category && t.screenType === screenType
  );
}

// Generate test level by specific index within category+screenType
export function generateTestLevelByScreen(
  category: Category,
  screenType: string,
  index?: number
): Level {
  const templates = LEVEL_CATALOG.filter(
    (t) => t.category === category && t.screenType === screenType
  );

  if (templates.length === 0) return generateTestLevel(category);

  const template = index !== undefined
    ? templates[index % templates.length]
    : pickRandom(templates);

  const params: Record<string, unknown> = { ...template.params };
  let instruction = template.instruction;

  // Same resolve logic
  if (template.rule === "remember_number" && !params.rememberValue) {
    params.rememberValue = getRandomInt(2, 7);
  }
  if (template.rule === "remember_icon" && !params.rememberIcon) {
    params.rememberIcon = pickRandom(ICONS);
  }
  if (template.rule === "recall_icon" && !params.targetIcon) {
    params.targetIcon = pickRandom(ICONS);
  }
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
    params.shouldTap = matchType === "color" ? inkColor === target : textColor === target;
  }
  if (template.rule === "math_tap" && !params.expression) {
    const ops = [
      { a: 2, b: 2, op: "+", answer: 4 },
      { a: 3, b: 1, op: "+", answer: 4 },
      { a: 5, b: 2, op: "-", answer: 3 },
      { a: 3, b: 2, op: "+", answer: 5 },
      { a: 2, b: 3, op: "x", answer: 6 },
    ];
    const chosen = pickRandom(ops);
    params.expression = `${chosen.a}${chosen.op}${chosen.b}`;
    params.answer = chosen.answer;
    params.displayed = chosen.answer + pickRandom([-2, -1, 1, 2]);
  }

  for (const [key, value] of Object.entries(params)) {
    instruction = instruction.replace(`{${key}}`, String(value));
  }

  return {
    id: 999,
    instruction,
    rule: template.rule,
    params,
    timeLimit: (template.timeLimit ?? 4.0) * 1000,
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