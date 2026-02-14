export type RuleType =
  | "tap_once"
  | "tap_n_times"
  | "dont_tap"
  | "double_tap"
  | "tap_and_hold"
  | "remember_number"
  | "recall_number"
  | "remember_icon"
  | "recall_icon"
  | "opposite";

export interface RuleParams {
  count?: number;
  holdDuration?: number;
  rememberValue?: number;
  rememberIcon?: string;
  targetIcon?: string;
  decoyIcons?: string[];
}

export interface Level {
  id: number;
  instruction: string;
  rule: RuleType;
  params: RuleParams;
  timeLimit: number;
  deceptive?: boolean;
}

export interface GameState {
  status: "idle" | "playing" | "failed" | "level_complete" | "game_over";
  currentLevel: number;
  score: number;
  lives: number;
  tapCount: number;
  timeRemaining: number;
  combo: number;
  rememberedNumber: number | null;
  rememberedIcon: string | null;
}

export interface ValidationResult {
  passed: boolean;
  reason?: "wrong_count" | "tapped_when_shouldnt" | "time_expired" | "too_slow" | "wrong_answer";
}