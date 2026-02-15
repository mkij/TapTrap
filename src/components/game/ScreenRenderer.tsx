import React, { memo } from "react";
import { Level, GameState, ActionType, ScreenType } from "../../engine/types";
import StandardScreen from "./screens/StandardScreen";
import UpsideDownScreen from "./screens/UpsideDownScreen";
import StroopScreen from "./screens/StroopScreen";
import GlitchScreen from "./screens/GlitchScreen";
import CrashScreen from "./screens/CrashScreen";


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