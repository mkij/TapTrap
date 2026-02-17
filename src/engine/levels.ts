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
  // === HABIT: Delayed button ===
  {
    id: "H01",
    instruction: "Tap!",
    rule: "delayed_button",
    params: { delay: 2 },
    category: "habit",
    subCategory: "delayed",
    screenType: "delayed_button",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "H01b",
    instruction: "Tap now!",
    rule: "delayed_button",
    params: { delay: 3 },
    category: "habit",
    subCategory: "delayed",
    screenType: "delayed_button",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "H01c",
    instruction: "Tap!",
    rule: "delayed_button",
    params: { delay: 1.5 },
    category: "habit",
    subCategory: "delayed",
    screenType: "delayed_button",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 4.0,
  },
  // === HABIT: Fake next ===
  {
    id: "H02",
    instruction: "",
    rule: "fake_next",
    params: { fakeLabel: "NEXT" },
    category: "habit",
    subCategory: "fake_ui",
    screenType: "fake_next",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "H02b",
    instruction: "",
    rule: "fake_next",
    params: { fakeLabel: "CONTINUE" },
    category: "habit",
    subCategory: "fake_ui",
    screenType: "fake_next",
    inputType: "none",
    difficulty: 2,
    timeLimit: 3.0,
  },
  {
    id: "H02c",
    instruction: "",
    rule: "fake_next",
    params: { fakeLabel: "TAP TO CONTINUE" },
    category: "habit",
    subCategory: "fake_ui",
    screenType: "fake_next",
    inputType: "none",
    difficulty: 3,
    timeLimit: 2.5,
  },
  // === SURPRISE: Fake delete ===
  {
    id: "S03",
    instruction: "",
    rule: "fake_delete",
    params: {},
    category: "surprise",
    subCategory: "fake_ui",
    screenType: "fake_delete",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "S03b",
    instruction: "",
    rule: "fake_delete",
    params: {},
    category: "surprise",
    subCategory: "fake_ui",
    screenType: "fake_delete",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  // === SURPRISE: Jumpscare ===
  {
    id: "S04",
    instruction: "Tap once",
    rule: "jumpscare",
    params: { scareDelay: 1.5 },
    category: "surprise",
    subCategory: "jumpscare",
    screenType: "jumpscare",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "S04b",
    instruction: "Tap once",
    rule: "jumpscare",
    params: { scareDelay: 0.8 },
    category: "surprise",
    subCategory: "jumpscare",
    screenType: "jumpscare",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 4.0,
  },
  {
    id: "S04c",
    instruction: "Don't tap!",
    rule: "jumpscare",
    params: { scareDelay: 1.0 },
    category: "surprise",
    subCategory: "jumpscare",
    screenType: "jumpscare",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 4.0,
  },
  // === SURPRISE: Misleading counter ===
  {
    id: "S05",
    instruction: "Tap 3 times",
    rule: "misleading_counter",
    params: { count: 3, misleadMode: "random" },
    category: "surprise",
    subCategory: "misleading",
    screenType: "misleading_counter",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "S05b",
    instruction: "Tap 4 times",
    rule: "misleading_counter",
    params: { count: 4, misleadMode: "reverse" },
    category: "surprise",
    subCategory: "misleading",
    screenType: "misleading_counter",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "S05c",
    instruction: "Tap 3 times",
    rule: "misleading_counter",
    params: { count: 3, misleadMode: "stuck" },
    category: "surprise",
    subCategory: "misleading",
    screenType: "misleading_counter",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 4.0,
  },
  {
    id: "S05d",
    instruction: "Tap 5 times",
    rule: "misleading_counter",
    params: { count: 5, misleadMode: "skip" },
    category: "surprise",
    subCategory: "misleading",
    screenType: "misleading_counter",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 5.0,
  },
  // === PERCEPTION: Backwards text ===
  {
    id: "P10",
    instruction: "ecno paT",
    rule: "tap_once",
    params: { realInstruction: "Tap once" },
    category: "perception",
    subCategory: "backwards",
    screenType: "backwards_text",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "P10b",
    instruction: "!pat t'noD",
    rule: "dont_tap",
    params: { realInstruction: "Don't tap!" },
    category: "perception",
    subCategory: "backwards",
    screenType: "backwards_text",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "P10c",
    instruction: "pat elbuoD",
    rule: "double_tap",
    params: { realInstruction: "Double tap" },
    category: "perception",
    subCategory: "backwards",
    screenType: "backwards_text",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 4.0,
  },
  // === PERCEPTION: Count words ===
  {
    id: "P11",
    instruction: "Count the words",
    rule: "count_words",
    params: { wordCount: 3 },
    category: "perception",
    subCategory: "count",
    screenType: "count_words",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 6.0,
  },
  {
    id: "P11b",
    instruction: "Count the words",
    rule: "count_words",
    params: { wordCount: 5 },
    category: "perception",
    subCategory: "count",
    screenType: "count_words",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 6.0,
  },
  {
    id: "P11c",
    instruction: "Count the words",
    rule: "count_words",
    params: { wordCount: 7 },
    category: "perception",
    subCategory: "count",
    screenType: "count_words",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 7.0,
  },
  // === PERCEPTION: Tap biggest ===
  {
    id: "P12",
    instruction: "Tap the biggest",
    rule: "tap_target",
    params: { circleCount: 4 },
    category: "perception",
    subCategory: "tap_biggest",
    screenType: "tap_biggest",
    inputType: "tap_target",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "P12b",
    instruction: "Tap the biggest",
    rule: "tap_target",
    params: { circleCount: 5 },
    category: "perception",
    subCategory: "tap_biggest",
    screenType: "tap_biggest",
    inputType: "tap_target",
    difficulty: 2,
    timeLimit: 4.0,
  },
  // === PERCEPTION: Tap darkest ===
  {
    id: "P13",
    instruction: "Tap the darkest",
    rule: "tap_target",
    params: { circleCount: 4 },
    category: "perception",
    subCategory: "tap_darkest",
    screenType: "tap_darkest",
    inputType: "tap_target",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "P13b",
    instruction: "Tap the darkest",
    rule: "tap_target",
    params: { circleCount: 5 },
    category: "perception",
    subCategory: "tap_darkest",
    screenType: "tap_darkest",
    inputType: "tap_target",
    difficulty: 3,
    timeLimit: 4.0,
  },
  // === PERCEPTION: Fake panic ===
  {
    id: "P14",
    instruction: "",
    rule: "fake_panic",
    params: {},
    category: "perception",
    subCategory: "fake_panic",
    screenType: "fake_panic",
    inputType: "none",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "P14b",
    instruction: "",
    rule: "fake_panic",
    params: {},
    category: "perception",
    subCategory: "fake_panic",
    screenType: "fake_panic",
    inputType: "none",
    difficulty: 3,
    timeLimit: 3.0,
  },
  // === CONFLICT: Shifting instruction ===
  {
    id: "C05",
    instruction: "Tap once",
    rule: "tap_once",
    params: { shiftTexts: ["Don't tap!", "Tap 3 times", "Tap once"], settleAfter: 2.0, shiftSpeed: 0.4 },
    category: "conflict",
    subCategory: "shifting",
    screenType: "shifting_instruction",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C05b",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: { shiftTexts: ["Tap once", "Double tap", "Don't tap!"], settleAfter: 1.5, shiftSpeed: 0.3 },
    category: "conflict",
    subCategory: "shifting",
    screenType: "shifting_instruction",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C05c",
    instruction: "Double tap",
    rule: "double_tap",
    params: { shiftTexts: ["Tap once", "Don't tap!", "Tap 3 times", "Double tap"], settleAfter: 2.5, shiftSpeed: 0.35 },
    category: "conflict",
    subCategory: "shifting",
    screenType: "shifting_instruction",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 6.0,
  },
  // === CONFLICT: Dual instruction ===
  {
    id: "C06",
    instruction: "Tap once",
    rule: "tap_once",
    params: { fakeInstruction: "Don't tap!", hintColor: "green", correctPosition: "top" },
    category: "conflict",
    subCategory: "dual",
    screenType: "dual_instruction",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C06b",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: { fakeInstruction: "Tap once", hintColor: "blue", correctPosition: "bottom" },
    category: "conflict",
    subCategory: "dual",
    screenType: "dual_instruction",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C06c",
    instruction: "Double tap",
    rule: "double_tap",
    params: { fakeInstruction: "Tap once", hintColor: "green", correctPosition: "bottom" },
    category: "conflict",
    subCategory: "dual",
    screenType: "dual_instruction",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 5.0,
  },
  {
    id: "C06d",
    instruction: "Tap once",
    rule: "tap_once",
    params: { fakeInstruction: "Double tap", hintColor: "red", correctPosition: "top" },
    category: "conflict",
    subCategory: "dual",
    screenType: "dual_instruction",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 4.0,
  },
  // === CONFLICT: Truth / Lie chain ===
  {
    id: "C07",
    instruction: "Tap once",
    rule: "tap_once",
    params: { isLie: false, displayedInstruction: "Tap once" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "tap",
    difficulty: 1,
    timeLimit: 5.0,
  },
  {
    id: "C07b",
    instruction: "Tap once",
    rule: "tap_once",
    params: { isLie: true, displayedInstruction: "Don't tap!" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C07c",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: { isLie: false, displayedInstruction: "Don't tap!" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "none",
    difficulty: 1,
    timeLimit: 4.0,
  },
  {
    id: "C07d",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: { isLie: true, displayedInstruction: "Tap once" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "none",
    difficulty: 2,
    timeLimit: 5.0,
  },
  {
    id: "C07e",
    instruction: "Double tap",
    rule: "double_tap",
    params: { isLie: true, displayedInstruction: "Don't tap!" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 5.0,
  },
  {
    id: "C07f",
    instruction: "Don't tap!",
    rule: "dont_tap",
    params: { isLie: true, displayedInstruction: "Double tap" },
    category: "conflict",
    subCategory: "truth_lie",
    screenType: "truth_lie",
    inputType: "none",
    difficulty: 3,
    timeLimit: 4.0,
  },
  // === MEMORY: Cue match (dont press if matches memory icon) ===
  {
    id: "M10",
    instruction: "Matches memory? Don't tap!",
    rule: "dont_press_with_cue",
    params: { cueIcon: "⭐" },
    category: "memory",
    subCategory: "cue_match",
    screenType: "cue_match",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
    requiresMemory: true,
  },
  {
    id: "M10b",
    instruction: "Matches memory? Don't tap!",
    rule: "dont_press_with_cue",
    params: { cueIcon: "🔥" },
    category: "memory",
    subCategory: "cue_match",
    screenType: "cue_match",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 4.0,
    requiresMemory: true,
  },
  {
    id: "M10c",
    instruction: "Matches memory? Don't tap!",
    rule: "dont_press_with_cue",
    params: { cueIcon: "💎" },
    category: "memory",
    subCategory: "cue_match",
    screenType: "cue_match",
    inputType: "conditional",
    difficulty: 2,
    timeLimit: 3.5,
    requiresMemory: true,
  },
  // === MEMORY: Recall distant number ===
  {
    id: "M11",
    instruction: "Tap the last number you memorized",
    rule: "recall_distant",
    params: { stepsBack: 1 },
    category: "memory",
    subCategory: "recall_distant",
    screenType: "recall_distant",
    inputType: "tap",
    difficulty: 2,
    timeLimit: 5.0,
    requiresMemory: true,
  },
  {
    id: "M11b",
    instruction: "Tap the 2nd last number",
    rule: "recall_distant",
    params: { stepsBack: 2 },
    category: "memory",
    subCategory: "recall_distant",
    screenType: "recall_distant",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 6.0,
    requiresMemory: true,
  },
  {
    id: "M11c",
    instruction: "Tap the 3rd last number",
    rule: "recall_distant",
    params: { stepsBack: 3 },
    category: "memory",
    subCategory: "recall_distant",
    screenType: "recall_distant",
    inputType: "tap",
    difficulty: 3,
    timeLimit: 7.0,
    requiresMemory: true,
  },
  // === MEMORY: Avoid previous color ===
  {
    id: "M12",
    instruction: "Avoid the previous color!",
    rule: "avoid_color",
    params: { circleCount: 4, forbiddenColor: "red", levelColor: "blue" },
    category: "memory",
    subCategory: "avoid_color",
    screenType: "avoid_color",
    inputType: "tap_target",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "M12b",
    instruction: "Avoid the previous color!",
    rule: "avoid_color",
    params: { circleCount: 5, forbiddenColor: "blue", levelColor: "green" },
    category: "memory",
    subCategory: "avoid_color",
    screenType: "avoid_color",
    inputType: "tap_target",
    difficulty: 2,
    timeLimit: 4.0,
  },
  {
    id: "M12c",
    instruction: "Avoid the previous color!",
    rule: "avoid_color",
    params: { circleCount: 5, forbiddenColor: "green", levelColor: "red" },
    category: "memory",
    subCategory: "avoid_color",
    screenType: "avoid_color",
    inputType: "tap_target",
    difficulty: 3,
    timeLimit: 3.5,
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