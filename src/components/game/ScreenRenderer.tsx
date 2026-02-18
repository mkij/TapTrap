import React, { memo } from "react";
import { Level, GameState, ActionType, ScreenType } from "../../engine/types";
import StandardScreen from "./screens/StandardScreen";
import UpsideDownScreen from "./screens/UpsideDownScreen";
import StroopScreen from "./screens/StroopScreen";
import GlitchScreen from "./screens/GlitchScreen";
import CrashScreen from "./screens/CrashScreen";
import HoldScreen from "./screens/HoldScreen";
import DelayedButtonScreen from "./screens/DelayedButtonScreen";
import FakeNextScreen from "./screens/FakeNextScreen";
import FakeDeleteScreen from "./screens/FakeDeleteScreen";
import JumpscareScreen from "./screens/JumpscareScreen";
import MisleadingCounterScreen from "./screens/MisleadingCounterScreen";
import BackwardsTextScreen from "./screens/BackwardsTextScreen";
import CountWordsScreen from "./screens/CountWordsScreen";
import TapBiggestScreen from "./screens/TapBiggestScreen";
import TapDarkestScreen from "./screens/TapDarkestScreen";
import FakePanicScreen from "./screens/FakePanicScreen";
import ShiftingInstructionScreen from "./screens/ShiftingInstructionScreen";
import DualInstructionScreen from "./screens/DualInstructionScreen";
import TruthLieScreen from "./screens/TruthLieScreen";
import CueMatchScreen from "./screens/CueMatchScreen";
import RecallDistantScreen from "./screens/RecallDistantScreen";
import AvoidColorScreen from "./screens/AvoidColorScreen";
import ShakeScreen from "./screens/ShakeScreen";
import RotateScreen from "./screens/RotateScreen";
import VibrationHintScreen from "./screens/VibrationHintScreen";
import MultiTouchScreen from "./screens/MultiTouchScreen";
import NumberPickScreen from "./screens/NumberPickScreen";
import CountdownScreen from "./screens/CountdownScreen";
import FadingTextScreen from "./screens/FadingTextScreen";



interface ScreenRendererProps {
  level: Level;
  state: GameState;
  progress: number;
  onTap: () => void;
  onAction: (action: ActionType) => void;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

// Registry of screen components by screenType
// Add new screens here as they are implemented
const SCREEN_MAP: Partial<Record<ScreenType, React.ComponentType<any>>> = {
  upside_down: UpsideDownScreen,
  stroop_display: StroopScreen,
  glitch_screen: GlitchScreen,
  crash_screen: CrashScreen,
  hold_timer: HoldScreen,
  delayed_button: DelayedButtonScreen,
  fake_next: FakeNextScreen,
  fake_delete: FakeDeleteScreen,
  jumpscare: JumpscareScreen,
  misleading_counter: MisleadingCounterScreen,
  backwards_text: BackwardsTextScreen,
  count_words: CountWordsScreen,
  tap_biggest: TapBiggestScreen,
  tap_darkest: TapDarkestScreen,
  fake_panic: FakePanicScreen,
  shifting_instruction: ShiftingInstructionScreen,
  dual_instruction: DualInstructionScreen,
  truth_lie: TruthLieScreen,
  cue_match: CueMatchScreen,
  recall_distant: RecallDistantScreen,
  avoid_color: AvoidColorScreen,
  shake_screen: ShakeScreen,
  rotate_screen: RotateScreen,
  vibration_hint: VibrationHintScreen,
  multi_touch: MultiTouchScreen,
  number_pick: NumberPickScreen,
  countdown: CountdownScreen,
  fading_text: FadingTextScreen,
};

function ScreenRenderer({
  level,
  state,
  progress,
  onTap,
  onAction,
  onContinue,
  onRetry,
  onMenu,
}: ScreenRendererProps) {
  const screenType = level.screenType ?? "standard";
  console.log("SCREEN_TYPE:", screenType, "HAS_COMPONENT:", !!SCREEN_MAP[screenType]);
  const ScreenComponent = SCREEN_MAP[screenType];

  // If custom screen exists, use it
  if (ScreenComponent) {
    return (
      <ScreenComponent
        level={level}
        state={state}
        progress={progress}
        onTap={onTap}
        onAction={onAction}
        onContinue={onContinue}
        onRetry={onRetry}
        onMenu={onMenu}
      />
    );
  }

  // Default: StandardScreen handles all unimplemented screen types
  return (
    <StandardScreen
      level={level}
      state={state}
      progress={progress}
      onTap={onTap}
      onContinue={onContinue}
      onRetry={onRetry}
      onMenu={onMenu}
    />
  );
}

export default memo(ScreenRenderer);