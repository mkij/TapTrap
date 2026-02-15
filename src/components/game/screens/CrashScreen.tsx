import React, { useState, useEffect, memo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState } from "../../../engine/types";

interface Props {
  level: Level;
  state: GameState;
  progress: number;
  onTap: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

function CrashScreen({
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
  const [phase, setPhase] = useState<"loading" | "crash" | "done">("loading");

  useEffect(() => {
    if (!isPlaying) return;

    // Phase 1: Brief "loading" then crash
    const t1 = setTimeout(() => setPhase("crash"), 600);
    return () => clearTimeout(t1);
  }, [isPlaying]);

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  // Success/fail state
  if (isFailed || isLevelComplete) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.centerContent}>
          <Text
            style={[
              styles.statusText,
              { color: isFailed ? COLORS.danger : COLORS.accent },
            ]}
          >
            {isFailed ? "FAILED" : "NICE!"}
          </Text>
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

  // Loading phase
  if (phase === "loading") {
    return (
      <View style={styles.wrapper}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Crash phase — tap anywhere to "fix"
  return (
    <Pressable style={styles.crashWrapper} onPress={onTap}>
      <View style={styles.crashBox}>
        <Text style={styles.crashTitle}>TapTrap has stopped</Text>
        <Text style={styles.crashBody}>
          Unfortunately, TapTrap has stopped working.{"\n"}
          An unexpected error occurred.
        </Text>
        <Text style={styles.crashCode}>
          ERR_LEVEL_{state.currentLevel}_FATAL{"\n"}
          at GameEngine.run (engine:42){"\n"}
          at Timer.tick (loop:108)
        </Text>
        <View style={styles.crashButton}>
          <Text style={styles.crashButtonText}>CLOSE APP</Text>
        </View>
        <Text style={styles.crashHint}>
          (tap anywhere to fix)
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  statusText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  crashWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  crashBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,51,85,0.3)",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 12,
    maxWidth: 320,
  },
  crashTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
    letterSpacing: 1,
  },
  crashBody: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  crashCode: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: "left",
    alignSelf: "stretch",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 10,
    borderRadius: 6,
    lineHeight: 16,
  },
  crashButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,51,85,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,51,85,0.3)",
    marginTop: 4,
  },
  crashButtonText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
    letterSpacing: 2,
  },
  crashHint: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.15)",
    marginTop: 4,
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

export default memo(CrashScreen);