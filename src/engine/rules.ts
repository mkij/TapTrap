import { Level, GameState, ValidationResult, ActionType } from "./types";

// --- Validator function signature ---
type ValidatorFn = (
    level: Level,
    state: GameState,
    action: ActionType
) => ValidationResult;

// --- Validator registry ---
const validators: Record<string, ValidatorFn> = {};

export function registerValidator(rule: string, fn: ValidatorFn): void {
    validators[rule] = fn;
}

export function validateAction(
    level: Level,
    state: GameState,
    action: ActionType | "tap" | "timer_expired"
): ValidationResult {
    const validator = validators[level.rule];
    if (!validator) {
        console.warn(`No validator for rule: ${level.rule}`);
        return { passed: false };
    }
    return validator(level, state, action as ActionType);
}

// --- Basic rules ---

registerValidator("tap_once", (_level, state, action) => {
    if (action === "tap") return { passed: false };
    if (state.tapCount === 1) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

registerValidator("tap_n_times", (level, state, action) => {
    if (action === "tap") return { passed: false };
    if (state.tapCount === level.params.count) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

registerValidator("dont_tap", (_level, _state, action) => {
    if (action === "tap") return { passed: false, reason: "tapped_when_shouldnt" };
    return { passed: true };
});

registerValidator("double_tap", (_level, state, action) => {
    if (action === "tap") return { passed: false };
    if (state.tapCount === 2) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

registerValidator("tap_and_hold", (_level, _state, action) => {
    // "tap" = hold completed (screen calls onTap when fill reaches target)
    if (action === "tap") return { passed: true };
    // "hold_end" = released too early
    if (action === "hold_end") return { passed: false, reason: "wrong_timing" };
    // timer expired
    return { passed: false, reason: "time_expired" };
});

// --- Memory rules ---

registerValidator("remember_number", (_level, _state, action) => {
    if (action === "timer_expired") return { passed: true };
    return { passed: false, reason: "tapped_when_shouldnt" };
});

registerValidator("recall_number", (_level, state, action) => {
    if (action === "tap") {
        const newCount = state.tapCount + 1;
        if (newCount === state.rememberedNumber) return { passed: true };
        if (newCount > state.rememberedNumber!) {
            return { passed: false, reason: "wrong_answer" };
        }
        return { passed: false };
    }
    return { passed: false, reason: "time_expired" };
});

registerValidator("remember_icon", (_level, _state, action) => {
    if (action === "timer_expired") return { passed: true };
    return { passed: false, reason: "tapped_when_shouldnt" };
});

registerValidator("recall_icon", (level, state, action) => {
    if (action === "tap") {
        const isCorrectIcon = level.params.targetIcon === state.rememberedIcon;
        if (isCorrectIcon) return { passed: true };
        return { passed: false, reason: "wrong_answer" };
    }
    if (level.params.targetIcon !== state.rememberedIcon) return { passed: true };
    return { passed: false, reason: "too_slow" };
});

// --- Opposite rule ---

registerValidator("opposite", (level, state, action) => {
    if (level.params.count === 0) {
        // Instruction says "don't tap" -> should tap
        if (action === "tap" && state.tapCount === 0) return { passed: true };
        if (action === "timer_expired") return { passed: false, reason: "too_slow" };
        return { passed: false, reason: "wrong_count" };
    } else {
        // Instruction says "tap" -> should not tap
        if (action === "tap") return { passed: false, reason: "tapped_when_shouldnt" };
        return { passed: true };
    }
});

// --- Math rules ---

registerValidator("math_tap", (level, state, action) => {
    // Player must tap exactly params.answer times, ignoring displayed value
    if (action === "tap") return { passed: false };
    if (state.tapCount === level.params.answer) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

// --- Memory: repeat previous ---

registerValidator("repeat_previous", (_level, state, action) => {
    const prevAction = state.memory.previousCorrectAction as string | null;

    // If previous correct action was "tap" -> player should tap
    if (prevAction === "tap") {
        if (action === "tap") return { passed: false };
        if (state.tapCount === 1) return { passed: true };
        return { passed: false, reason: "wrong_count" };
    }

    // If previous was "timer_expired" (waited) -> player should not tap
    if (prevAction === "timer_expired") {
        if (action === "tap") return { passed: false, reason: "tapped_when_shouldnt" };
        return { passed: true };
    }

    // No previous action (first level) -> default to tap once
    if (action === "tap") return { passed: false };
    if (state.tapCount === 1) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

// --- Conflict: prewarning (auto-pass, sets context for next level) ---

registerValidator("prewarning", (_level, _state, action) => {
    if (action === "timer_expired") return { passed: true };
    return { passed: false, reason: "tapped_when_shouldnt" };
});

// --- Stroop rule ---

registerValidator("stroop", (level, state, action) => {
    // Player must tap if target matches the condition, else don't tap
    const shouldTap = level.params.shouldTap as boolean;

    if (shouldTap) {
        if (action === "tap" && state.tapCount === 0) return { passed: true };
        if (action === "timer_expired") return { passed: false, reason: "too_slow" };
        return { passed: false };
    } else {
        if (action === "tap") return { passed: false, reason: "tapped_when_shouldnt" };
        return { passed: true };
    }
});

// --- Visual glitch (normal tap rule underneath) ---

registerValidator("visual_glitch", (_level, state, action) => {
    if (action === "tap") return { passed: false };
    if (state.tapCount === 1) return { passed: true };
    return { passed: false, reason: "wrong_count" };
});

// --- Fake crash (tap to fix) ---

registerValidator("fake_crash", (_level, state, action) => {
    if (action === "tap" && state.tapCount === 0) return { passed: true };
    if (action === "timer_expired") return { passed: false, reason: "too_slow" };
    return { passed: false };
});

// --- Hold timed: release at the right moment ---

registerValidator("hold_timed", (level, _state, action) => {
    // "tap" = hold completed (player released at right time)
    if (action === "tap") return { passed: true };
    // "hold_end" = released at wrong time
    if (action === "hold_end") return { passed: false, reason: "wrong_timing" };
    // timer expired without holding
    return { passed: false, reason: "time_expired" };
});

// --- Habit: Delayed button ---
registerValidator("delayed_button", (_level, _state, action) => {
    if (action === "tap") return { passed: true };
    if (action === "timer_expired") return { passed: false, reason: "time_expired" };
    return { passed: false, reason: "wrong_timing" };
});

// --- Habit: Fake next button ---
registerValidator("fake_next", (_level, _state, action) => {
    if (action === "tap") return { passed: false, reason: "wrong_count" };
    if (action === "timer_expired") return { passed: true };
    return { passed: false };
});

// --- Surprise: Fake delete (dont tap anything) ---
registerValidator("fake_delete", (_level, _state, action) => {
    if (action === "tap") return { passed: false, reason: "wrong_count" };
    if (action === "timer_expired") return { passed: true };
    return { passed: false };
});

// --- Surprise: Jumpscare (tap once despite scare, cosmetic only) ---
registerValidator("jumpscare", (_level, _state, action) => {
    // Screen blocks taps before scare, so any tap that reaches here = post-scare
    if (action === "tap") return { passed: true };
    if (action === "timer_expired") return { passed: false, reason: "time_expired" };
    return { passed: false };
});

// --- Surprise: Misleading counter (tap_n_times but display lies) ---
registerValidator("misleading_counter", (level, state, action) => {
    const target = (level.params.count as number) ?? 3;
    if (action === "tap") {
        const newCount = state.tapCount + 1;
        if (newCount === target) return { passed: true };
        if (newCount > target) return { passed: false, reason: "wrong_count" };
        return { passed: false }; // keep going
    }
    if (action === "timer_expired") {
        return state.tapCount === target
            ? { passed: true }
            : { passed: false, reason: "time_expired" };
    }
    return { passed: false };
});

// --- Perception: Count words (tap N times = word count) ---
registerValidator("count_words", (level, state, action) => {
  const target = (level.params.wordCount as number) ?? 3;
  if (action === "tap") {
    const newCount = state.tapCount + 1;
    if (newCount === target) return { passed: true };
    if (newCount > target) return { passed: false, reason: "wrong_count" };
    return { passed: false }; // keep going
  }
  if (action === "timer_expired") {
    return state.tapCount === target
      ? { passed: true }
      : { passed: false, reason: "time_expired" };
  }
  return { passed: false };
});

// --- Perception: Tap biggest / tap darkest (screen validates correct target) ---
registerValidator("tap_target", (_level, _state, action) => {
  // "tap" = correct target (screen sends onTap only for correct)
  if (action === "tap") return { passed: true };
  // "hold_end" = wrong target (screen sends this for wrong picks)
  if (action === "hold_end") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Perception: Fake panic (dont tap) ---
registerValidator("fake_panic", (_level, _state, action) => {
  if (action === "tap") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: true };
  return { passed: false };
});