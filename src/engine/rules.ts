import { Level, GameState, ValidationResult } from "./types";

export function validateAction(
    level: Level,
    state: GameState,
    action: "tap" | "timer_expired"
): ValidationResult {
    switch (level.rule) {
        case "tap_once":
            if (action === "tap") {
                return { passed: false };
            }
            if (state.tapCount === 1) return { passed: true };
            return { passed: false, reason: "wrong_count" };

        case "tap_n_times":
            if (action === "tap") {
                // Just count, no validation yet
                return { passed: false };
            }
            // Timer expired - check final count
            if (state.tapCount === level.params.count) return { passed: true };
            return { passed: false, reason: "wrong_count" };

        case "dont_tap":
            if (action === "tap") {
                return { passed: false, reason: "tapped_when_shouldnt" };
            }
            // Timer expired without tapping = success
            return { passed: true };

        case "double_tap":
            if (action === "tap") {
                return { passed: false };
            }
            if (state.tapCount === 2) return { passed: true };
            return { passed: false, reason: "wrong_count" };

        case "tap_and_hold":
            // Handled separately via gesture duration
            return { passed: false };

        case "remember_number":
            // Player just sees the number - auto pass on timer
            if (action === "timer_expired") return { passed: true };
            return { passed: false, reason: "tapped_when_shouldnt" };

        case "recall_number":
            if (action === "tap") {
                const newCount = state.tapCount + 1;
                if (newCount === state.rememberedNumber) return { passed: true };
                if (newCount > state.rememberedNumber!) {
                    return { passed: false, reason: "wrong_answer" };
                }
                return { passed: false };
            }
            return { passed: false, reason: "time_expired" };

        case "remember_icon":
            // Player sees the icon - auto pass on timer
            if (action === "timer_expired") return { passed: true };
            return { passed: false, reason: "tapped_when_shouldnt" };

        case "recall_icon":
            // Tap only if correct icon is shown
            if (action === "tap") {
                const isCorrectIcon =
                    level.params.targetIcon === state.rememberedIcon;
                if (isCorrectIcon) return { passed: true };
                return { passed: false, reason: "wrong_answer" };
            }
            // Timer expired: pass only if icon was wrong (correctly didn't tap)
            if (level.params.targetIcon !== state.rememberedIcon) {
                return { passed: true };
            }
            return { passed: false, reason: "too_slow" };

        case "opposite":
            // Instruction says "tap" but correct action is don't tap (and vice versa)
            if (level.params.count === 0) {
                // Instruction says "don't tap" -> should tap
                if (action === "tap" && state.tapCount === 0) return { passed: true };
                if (action === "timer_expired") {
                    return { passed: false, reason: "too_slow" };
                }
                return { passed: false, reason: "wrong_count" };
            } else {
                // Instruction says "tap" -> should not tap
                if (action === "tap") {
                    return { passed: false, reason: "tapped_when_shouldnt" };
                }
                return { passed: true };
            }

        default:
            return { passed: false };
    }
}