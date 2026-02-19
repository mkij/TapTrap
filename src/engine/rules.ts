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

// --- Memory: Don't press with cue ---
registerValidator("dont_press_with_cue", (level, state, action) => {
  const cueIcon = level.params.cueIcon as string;
  const memorizedIcon = state.memory.icon;
  const matches = cueIcon === memorizedIcon;

  if (action === "tap") {
    // If cue matches memory → should NOT tap → fail
    // If cue doesn't match → should tap → pass
    return matches
      ? { passed: false, reason: "wrong_count" }
      : { passed: true };
  }
  if (action === "timer_expired") {
    // If cue matches → should NOT tap → pass
    // If cue doesn't match → should tap → fail
    return matches
      ? { passed: true }
      : { passed: false, reason: "time_expired" };
  }
  return { passed: false };
});

// --- Memory: Recall distant number ---
registerValidator("recall_distant", (level, state, action) => {
  const stepsBack = (level.params.stepsBack as number) ?? 1;
  const history = state.memory.numberHistory ?? [];
  const targetIndex = history.length - stepsBack;
  const targetNumber = targetIndex >= 0 ? history[targetIndex] : null;

  if (targetNumber === null) {
    // No history yet — auto pass to avoid unfair fail
    if (action === "timer_expired") return { passed: true };
    return { passed: false };
  }

  if (action === "tap") {
    const newCount = state.tapCount + 1;
    if (newCount === targetNumber) return { passed: true };
    if (newCount > targetNumber) return { passed: false, reason: "wrong_count" };
    return { passed: false }; // keep going
  }
  if (action === "timer_expired") {
    return state.tapCount === targetNumber
      ? { passed: true }
      : { passed: false, reason: "time_expired" };
  }
  return { passed: false };
});

// --- Memory: Avoid previous color (screen handles target validation) ---
registerValidator("avoid_color", (_level, _state, action) => {
  // "tap" = correct (non-forbidden) color picked by screen
  if (action === "tap") return { passed: true };
  // "hold_end" = wrong (forbidden) color picked by screen
  if (action === "hold_end") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Device: Shake ---
registerValidator("shake_detect", (_level, _state, action) => {
  if (action === "shake") return { passed: true };
  if (action === "tap") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Device: Rotate ---
registerValidator("rotate_detect", (_level, _state, action) => {
  if (action === "rotate") return { passed: true };
  if (action === "tap") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Device: Vibration hint (tap N times = vibration count) ---
registerValidator("vibration_count", (level, state, action) => {
  const target = (level.params.vibrationCount as number) ?? 3;
  if (action === "tap") {
    const newCount = state.tapCount + 1;
    if (newCount === target) return { passed: true };
    if (newCount > target) return { passed: false, reason: "wrong_count" };
    return { passed: false };
  }
  if (action === "timer_expired") {
    return state.tapCount === target
      ? { passed: true }
      : { passed: false, reason: "time_expired" };
  }
  return { passed: false };
});

// --- Device: Multi-touch ---
registerValidator("multi_touch_detect", (level, _state, action) => {
  // Screen sends "multi_touch" only when correct finger count detected
  if (action === "multi_touch") return { passed: true };
  if (action === "tap") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Math: Multiply (tap answer times) ---
registerValidator("math_multiply", (level, state, action) => {
  const answer = (level.params.answer as number) ?? 4;
  if (action === "tap") {
    return { passed: false }; // always keep going
  }
  if (action === "timer_expired") {
    return state.tapCount === answer
      ? { passed: true }
      : { passed: false, reason: "wrong_count" };
  }
  return { passed: false };
});

// --- Math: Tap prime (screen validates correct target) ---
registerValidator("tap_prime", (_level, _state, action) => {
  if (action === "tap") return { passed: true };
  if (action === "hold_end") return { passed: false, reason: "wrong_count" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Time: Tap at specific time ---
registerValidator("tap_at_time", (level, state, action) => {
  const targetSec = (level.params.targetSec as number) ?? 5;
  const tolerance = (level.params.tolerance as number) ?? 0.5;

  if (action === "tap") {
    const elapsed = (level.timeLimit - state.timeRemaining) / 1000;
    const diff = Math.abs(elapsed - targetSec);
    if (diff <= tolerance) return { passed: true };
    return { passed: false, reason: "wrong_timing" };
  }
  if (action === "timer_expired") {
    return { passed: false, reason: "time_expired" };
  }
  return { passed: false };
});

// --- Time: Tap before fade (use underlying rule, but fail if too late) ---
registerValidator("tap_before_fade", (level, state, action) => {
  const fadeMs = (level.params.fadeMs as number) ?? 2000;
  const expectedRule = (level.params.expectedRule as string) ?? "tap_once";
  const elapsedMs = level.timeLimit - state.timeRemaining;
  const faded = elapsedMs > fadeMs;

  if (action === "tap") {
    if (expectedRule === "dont_tap") {
      return { passed: false, reason: "wrong_count" };
    }
    if (faded) {
      return { passed: false, reason: "wrong_timing" };
    }
    if (expectedRule === "tap_once") {
      return state.tapCount + 1 === 1
        ? { passed: true }
        : { passed: false, reason: "wrong_count" };
    }
    if (expectedRule === "double_tap") {
      const newCount = state.tapCount + 1;
      if (newCount === 2) return { passed: true };
      if (newCount > 2) return { passed: false, reason: "wrong_count" };
      return { passed: false };
    }
    return { passed: true };
  }

  if (action === "timer_expired") {
    if (expectedRule === "dont_tap" && state.tapCount === 0) return { passed: true };
    return { passed: false, reason: "time_expired" };
  }

  return { passed: false };
});

// --- Time: Spaced double tap (screen enforces gap) ---
registerValidator("spaced_double", (_level, state, action) => {
  if (action === "tap") {
    const newCount = state.tapCount + 1;
    if (newCount === 2) return { passed: true };
    if (newCount > 2) return { passed: false, reason: "wrong_count" };
    return { passed: false }; // first tap, keep going
  }
  if (action === "hold_end") return { passed: false, reason: "wrong_timing" }; // too early
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Time: Hold and release in zone ---
registerValidator("hold_release", (_level, _state, action) => {
  // Screen handles zone detection:
  // "tap" = released in zone (correct)
  // "hold_end" = released outside zone (too early/late)
  // "hold_start" = bar filled completely (too late)
  if (action === "tap") return { passed: true };
  if (action === "hold_end") return { passed: false, reason: "wrong_timing" };
  if (action === "hold_start") return { passed: false, reason: "wrong_timing" };
  if (action === "timer_expired") return { passed: false, reason: "time_expired" };
  return { passed: false };
});

// --- Device: Battery tap (tap tens digit of battery %) ---
registerValidator("battery_tap", (level, state, action) => {
  const target = (level.params.batteryTens as number) ?? 0;
  if (action === "tap") {
    return { passed: false }; // keep going, check on timer
  }
  if (action === "timer_expired") {
    return state.tapCount === target
      ? { passed: true }
      : { passed: false, reason: "wrong_count" };
  }
  return { passed: false };
});