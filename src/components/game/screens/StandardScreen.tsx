import React, { useState, useEffect, memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import TapZone from "../TapZone";
import Instruction from "../Instruction";
import { COLORS } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState } from "../../../engine/types";

interface StandardScreenProps {
  level: Level;
  state: GameState;
  progress: number;
  onTap: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

function StandardScreen({
  level,
  state,
  progress,
  onTap,
  onContinue,
  onRetry,
  onMenu,
}: StandardScreenProps) {
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

  return (
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
        <Instruction
          text={level.instruction}
          failed={isFailed}
          success={isLevelComplete}
        />
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
  playArea: {
    alignItems: "center",
    gap: 24,
  },
  livesContainer: {
    flexDirection: "row",
    gap: 10,
  },
  lifeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lifeDotActive: {
    backgroundColor: COLORS.accent,
  },
  lifeDotEmpty: {
    backgroundColor: COLORS.textMuted,
  },
  instructionContainer: {
    minHeight: 40,
    justifyContent: "center",
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
  failSecondaryRow: {
    flexDirection: "row",
    gap: 24,
  },
  failSecondaryButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
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

export default memo(StandardScreen);