import React, { useState, useEffect, useRef, memo } from "react";
import { View, Pressable, Text, StyleSheet, Animated } from "react-native";
import TapZone from "../TapZone";
import Instruction from "../Instruction";
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

function GlitchScreen({
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

  // Glitch animations
  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchOpacity = useRef(new Animated.Value(1)).current;
  const skewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPlaying) return;

    const runGlitch = () => {
      const delay = 800 + Math.random() * 2000;

      setTimeout(() => {
        if (!isPlaying) return;

        Animated.parallel([
          Animated.sequence([
            Animated.timing(glitchX, { toValue: (Math.random() - 0.5) * 16, duration: 50, useNativeDriver: true }),
            Animated.timing(glitchX, { toValue: (Math.random() - 0.5) * 10, duration: 30, useNativeDriver: true }),
            Animated.timing(glitchX, { toValue: 0, duration: 40, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glitchOpacity, { toValue: 0.3, duration: 30, useNativeDriver: true }),
            Animated.timing(glitchOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(glitchOpacity, { toValue: 0.7, duration: 40, useNativeDriver: true }),
            Animated.timing(glitchOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(skewAnim, { toValue: (Math.random() - 0.5) * 4, duration: 50, useNativeDriver: true }),
            Animated.timing(skewAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]),
        ]).start(() => {
          if (isPlaying) runGlitch();
        });
      }, delay);
    };

    runGlitch();
  }, [isPlaying]);

  const skew = skewAnim.interpolate({
    inputRange: [-4, 4],
    outputRange: ["-4deg", "4deg"],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.playArea,
          {
            opacity: glitchOpacity,
            transform: [{ translateX: glitchX }, { skewX: skew }],
          },
        ]}
      >
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
      </Animated.View>

      {/* Chromatic aberration layers (only while playing) */}
      {isPlaying && (
        <>
          <Animated.View
            style={[styles.chromaticLayer, { opacity: 0.15, transform: [{ translateX: Animated.add(glitchX, 3) }] }]}
          >
            <Text style={[styles.chromaticText, { color: "#ff0000" }]}>
              {level.instruction}
            </Text>
          </Animated.View>
          <Animated.View
            style={[styles.chromaticLayer, { opacity: 0.12, transform: [{ translateX: Animated.add(glitchX, -3) }] }]}
          >
            <Text style={[styles.chromaticText, { color: "#0088ff" }]}>
              {level.instruction}
            </Text>
          </Animated.View>
        </>
      )}

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
  instructionContainer: { minHeight: 40, justifyContent: "center" },
  chromaticLayer: {
    position: "absolute",
    bottom: -20,
    alignItems: "center",
  },
  chromaticText: {
    fontSize: 22,
    fontFamily: FONTS.regular,
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

export default memo(GlitchScreen);