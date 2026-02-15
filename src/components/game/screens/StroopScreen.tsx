import React, { useState, useEffect, memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import TapZone from "../TapZone";
import { COLORS } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState } from "../../../engine/types";

const COLOR_MAP: Record<string, string> = {
  red: "#ff3355",
  green: "#00ff88",
  blue: "#3388ff",
  yellow: "#ffcc00",
  purple: "#aa55ff",
  orange: "#ff8833",
};

interface Props {
  level: Level;
  state: GameState;
  progress: number;
  onTap: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

function StroopScreen({
  level,
  state,
  progress,
  onTap,
  onContinue,
  onRetry,
  onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";

  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  // Stroop: text says one color, rendered in another color
  const textWord = (level.params.stroopText as string) || "RED";
  const inkColor = COLOR_MAP[(level.params.stroopColor as string) || "green"] || COLORS.accent;
  const matchType = (level.params.matchType as string) || "color";

  // Instruction tells player what to match
  const instruction = matchType === "color"
    ? "Tap if INK COLOR is:"
    : "Tap if WORD says:";
  const target = (level.params.target as string) || "green";

  return (
    <View style={styles.wrapper}>
      <View style={styles.playArea}>
        <View style={styles.livesContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.lifeDot,
                i < state.lives ? styles.lifeDotActive : styles.lifeDotEmpty,
              ]}
            />
          ))}
        </View>

        <TapZone
          progress={progress}
          tapCount={state.tapCount}
          disabled={!isPlaying}
          failed={isFailed}
          success={isLevelComplete}
          onTap={onTap}
        />

        <View style={styles.instructionContainer}>
          {isFailed ? (
            <Text style={[styles.statusText, { color: COLORS.danger }]}>FAILED</Text>
          ) : isLevelComplete ? (
            <Text style={[styles.statusText, { color: COLORS.accent }]}>NICE!</Text>
          ) : (
            <>
              <Text style={styles.instructionText}>{instruction}</Text>
              <Text style={styles.targetText}>{target.toUpperCase()}</Text>
              <Text style={[styles.stroopWord, { color: inkColor }]}>
                {textWord.toUpperCase()}
              </Text>
            </>
          )}
        </View>
      </View>

      {isFailed && showContinue && (
        <View style={styles.failButtonsAbsolute}>
          <Pressable style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </Pressable>
          <View style={styles.failSecondaryRow}>
            <Pressable style={styles.failSecondaryButton} onPress={onRetry}>
              <Text style={styles.failSecondaryText}>RETRY</Text>
            </Pressable>
            <View style={styles.failSecondaryDivider} />
            <Pressable style={styles.failSecondaryButton} onPress={onMenu}>
              <Text style={styles.failSecondaryText}>MENU</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  playArea: { alignItems: "center", gap: 24 },
  livesContainer: { flexDirection: "row", gap: 10 },
  lifeDot: { width: 10, height: 10, borderRadius: 5 },
  lifeDotActive: { backgroundColor: COLORS.accent },
  lifeDotEmpty: { backgroundColor: COLORS.textMuted },
  instructionContainer: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  targetText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: 3,
    color: COLORS.white,
    textAlign: "center",
  },
  stroopWord: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    letterSpacing: 4,
    textAlign: "center",
    marginTop: 8,
  },
  statusText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    textAlign: "center",
  },
  failButtonsAbsolute: {
    position: "absolute",
    bottom: -100,
    alignItems: "center",
    gap: 12,
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,51,85,0.2)",
    backgroundColor: "rgba(255,51,85,0.03)",
  },
  continueButtonText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 3,
    color: COLORS.danger,
  },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    letterSpacing: 3,
    color: COLORS.textSecondary,
  },
  failSecondaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
  },
});

export default memo(StroopScreen);