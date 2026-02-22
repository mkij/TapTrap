// --- Rule identifier (open string, validated by registry in rules.ts) ---
export type RuleType = string;

// --- Enums for level taxonomy ---

export type Category =
  | "basic"
  | "opposite"
  | "memory"
  | "perception"
  | "time"
  | "math"
  | "conflict"
  | "device"
  | "meta"
  | "habit"
  | "surprise"
  | "cumulative";

export type InputType =
  | "tap"
  | "hold"
  | "shake"
  | "rotate"
  | "volume"
  | "multi_touch"
  | "tap_target"
  | "conditional"
  | "none";

export type ScreenType =
  | "standard"
  | "number_display"
  | "icon_display"
  | "icon_match"
  | "upside_down"
  | "backwards"
  | "stroop_display"
  | "math_display"
  | "glitch_screen"
  | "crash_screen"
  | "fake_next_screen"
  | "delayed_button"
  | "fake_next"
  | "fake_delete"
  | "jumpscare"
  | "misleading_counter"
  | "backwards_text"
  | "count_words"
  | "tap_biggest"
  | "tap_darkest"
  | "fake_panic"
  | "shifting_instruction"
  | "dual_instruction"
  | "truth_lie"  
  | "cue_match"
  | "recall_distant"
  | "avoid_color"  
  | "shake_screen"
  | "rotate_screen"
  | "vibration_hint"
  | "multi_touch"  
  | "number_pick"
  | "countdown"
  | "ad_popup"
  | "captcha_screen"
  | "panic_timer"
  | "patience_screen"
  | "progress_bar"
  | "hold_timer"
  | "fading_text"
  | "spaced_double"
  | "hold_release"
  | "battery_prompt"
  | "countdown"
  | "blank_screen"
  | "shake_prompt"
  | "rotate_prompt"
  | "volume_prompt"
  | "multi_touch_prompt"
  | "battery_prompt"
  | "word_circle"
  | "arrow_target"
  | "color_grid"
  | "multi_element"
  | "deceptive_ui"
  | "transparent_ui"
  | "dual_button"
  | "dual_text"
  | "morphing_text"
  | "color_rule"
  | "number_sequence"
  | "warning_text"
  | "counter_display"
  | "delete_warning"
  | "jumpscare_screen"
  | "long_text"
  | "accusation"
  | "reassuring"
  | "dynamic_text"
  | "break_screen"
  | "tease_screen"
  | "cue_display"
  | "multi_icon"
  | "color_choice"
  | "icon_overlay"
  | "composite";

export type ActionType =
  | "tap"
  | "hold_start"
  | "hold_end"
  | "shake"
  | "rotate"
  | "volume_change"
  | "multi_touch"
  | "tap_target"
  | "timer_expired";

// --- Rule params (open record, each rule defines its own shape) ---
export type RuleParams = Record<string, unknown>;

// --- Level (extended, backward compatible) ---
export interface Level {
  id: number;
  instruction: string;
  rule: RuleType;
  params: RuleParams;
  timeLimit: number;

  // New taxonomy fields (optional during migration)
  category?: Category;
  subCategory?: string;
  screenType?: ScreenType;
  inputType?: InputType;
  difficulty?: 1 | 2 | 3;

  // Dependency flags
  requiresMemory?: boolean;
  requiresPrevious?: boolean;
  requiresDevice?: boolean;

  /** @deprecated Use category system instead */
  deceptive?: boolean;
}

// --- Memory store (replaces rememberedNumber/rememberedIcon) ---
export interface MemoryStore {
  number: number | null;
  icon: string | null;
  previousAction: ActionType | null;
  previousRule: RuleType | null;
  previousCorrectAction: string | null;
  colorHistory: string[];
  numberHistory: number[];
  iconHistory: string[];
  previousColor: string | null;
  errorCount: number;
  totalTaps: number;
  correctTaps: number;
  [key: string]: unknown;
}

export const INITIAL_MEMORY: MemoryStore = {
  number: null,
  icon: null,
  previousAction: null,
  previousRule: null,
  previousCorrectAction: null,
  colorHistory: [],
  numberHistory: [],
  iconHistory: [],
  previousColor: null,
  errorCount: 0,
  totalTaps: 0,
  correctTaps: 0,
};

// --- Game state ---
export interface GameState {
  status: "idle" | "playing" | "level_complete" | "failed" | "game_over" | "chapter_complete";
  currentLevel: number;
  score: number;
  lives: number;
  tapCount: number;
  timeRemaining: number;
  combo: number;
  memory: MemoryStore;

  /** @deprecated Use memory.number */
  rememberedNumber: number | null;
  /** @deprecated Use memory.icon */
  rememberedIcon: string | null;
}

// --- Validation ---
export type FailReason =
  | "wrong_count"
  | "tapped_when_shouldnt"
  | "time_expired"
  | "too_slow"
  | "wrong_answer"
  | "wrong_target"
  | "wrong_timing"
  | "wrong_input";

export interface ValidationResult {
  passed: boolean;
  reason?: FailReason;
  memoryUpdate?: Partial<MemoryStore>;
}

// --- Level template (used by level catalog/generator) ---
export interface LevelTemplate {
  id: string;
  instruction: string;
  rule: RuleType;
  params: RuleParams;
  category: Category;
  subCategory?: string;
  screenType: ScreenType;
  inputType: InputType;
  difficulty: 1 | 2 | 3;
  timeLimit: number;
  requiresMemory?: boolean;
  requiresPrevious?: boolean;
  requiresDevice?: boolean;
  tags?: string[];
}