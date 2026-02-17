import React, { useState, useEffect, useRef, memo } from "react";
import { View, Pressable, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { COLORS, getTimerColor } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState, ActionType } from "../../../engine/types";

const RING_RADIUS = 120;
const RING_SIZE = 300;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_SIZE = 200;

interface Props {
  level: Level;
  state: GameState;
  progress: number;
  onTap: () => void;
  onAction: (action: ActionType) => void;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

function FakeNextScreen({
  level,
  state,
  progress,
  onTap,
  onAction,
  onContinue,
  onRetry,
  onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";

  const [showContinue, setShowContinue] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isPlaying) {
      fadeIn.setValue(0);
      buttonScale.setValue(0.8);

      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(fadeIn, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(buttonScale, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [level.id, isPlaying]);

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  // Status icon animation
  const statusScale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (isFailed || isLevelComplete) {
      statusScale.setValue(0.3);
      Animated.spring(statusScale, {
        toValue: 1,
        friction: 4,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isFailed, isLevelComplete]);

  const handleFakePress = () => {
    if (!isPlaying) return;
    onTap(); // validator will fail this
  };

  const timerColor = isFailed
    ? COLORS.danger
    : isLevelComplete
      ? COLORS.accent
      : getTimerColor(progress);

  const strokeDash = CIRCUMFERENCE * progress;

  const fakeButtonLabel = (level.params.fakeLabel as string) ?? "NEXT";

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

      <View style={styles.ringContainer}>
        {/* Timer ring */}
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={COLORS.ringTrack}
            strokeWidth={10}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={timerColor}
            strokeWidth={isFailed || isLevelComplete ? 10 : 6}
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Inner area */}
        <View style={styles.inner}>
          {isFailed ? (
            <Animated.View style={{ transform: [{ scale: statusScale }] }}>
              <Svg width={60} height={60} viewBox="0 0 60 60">
                <Path d="M 15 15 L 45 45" stroke={COLORS.danger} strokeWidth={4} strokeLinecap="round" />
                <Path d="M 45 15 L 15 45" stroke={COLORS.danger} strokeWidth={4} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          ) : isLevelComplete ? (
            <Animated.View style={{ transform: [{ scale: statusScale }] }}>
              <Svg width={60} height={60} viewBox="0 0 60 60">
                <Path
                  d="M 14 33 Q 18 38 25 44 Q 34 32 48 16"
                  fill="none"
                  stroke={COLORS.accent}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.fakeArea,
                {
                  opacity: fadeIn,
                  transform: [{ scale: buttonScale }],
                },
              ]}
            >
              {/* Fake success checkmark */}
              <Svg width={40} height={40} viewBox="0 0 60 60" style={{ marginBottom: 4 }}>
                <Path
                  d="M 14 33 Q 18 38 25 44 Q 34 32 48 16"
                  fill="none"
                  stroke={COLORS.accent}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
              </Svg>

              <Text style={styles.fakeNice}>NICE!</Text>

              {/* Fake next button */}
              <Pressable
                style={styles.fakeButton}
                onPress={handleFakePress}
              >
                <Text style={styles.fakeButtonText}>{fakeButtonLabel}</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>

      {/* No instruction shown during play — the fake screen IS the trick */}
      {(isFailed || isLevelComplete) && (
        <View style={styles.instructionContainer}>
          <Text
            style={[
              styles.instructionText,
              {
                color: isFailed ? COLORS.danger : COLORS.accent,
              },
            ]}
          >
            {isFailed ? "FAILED" : "NICE!"}
          </Text>
          {isFailed && (
            <Text style={styles.trickReveal}>It was a trap!</Text>
          )}
        </View>
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
  playArea: { alignItems: "center", gap: 24 },
  livesContainer: { flexDirection: "row", gap: 10 },
  lifeDot: { width: 10, height: 10, borderRadius: 5 },
  lifeDotActive: { backgroundColor: COLORS.accent },
  lifeDotEmpty: { backgroundColor: COLORS.textMuted },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { position: "absolute" },
  inner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: COLORS.innerCircle,
    alignItems: "center",
    justifyContent: "center",
  },
  fakeArea: {
    alignItems: "center",
    gap: 2,
  },
  fakeNice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: 4,
    color: COLORS.accent,
    marginBottom: 8,
  },
  fakeButton: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(0,255,136,0.3)",
    backgroundColor: "rgba(0,255,136,0.06)",
  },
  fakeButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 4,
    color: COLORS.accent,
  },
  instructionContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  instructionText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  trickReveal: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    color: COLORS.textMuted,
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

export default memo(FakeNextScreen);