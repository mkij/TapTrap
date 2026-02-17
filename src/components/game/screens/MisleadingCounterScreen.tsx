import React, { useState, useEffect, useRef, memo } from "react";
import { View, Pressable, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Instruction from "../Instruction";
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

// Generate a misleading number based on real count
function fakeCount(real: number, mode: string): number {
  switch (mode) {
    case "skip":
      // Skips numbers: 1, 3, 4, 7...
      return real === 0 ? 0 : real + Math.floor(Math.random() * 3) + (real > 1 ? 1 : 0);
    case "reverse":
      // Counts down from a random high number
      return Math.max(0, 9 - real + Math.floor(Math.random() * 2));
    case "random":
      // Completely random each tap
      return real === 0 ? 0 : Math.floor(Math.random() * 9) + 1;
    case "stuck":
      // Gets stuck on 1 for a while
      return real <= 3 ? 1 : real - 2;
    default:
      return real;
  }
}

function MisleadingCounterScreen({
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
  const [displayCount, setDisplayCount] = useState(0);
  const [pressed, setPressed] = useState(false);

  const misleadMode = (level.params.misleadMode as string) ?? "random";

  // Update fake display when tap count changes
  useEffect(() => {
    setDisplayCount(fakeCount(state.tapCount, misleadMode));
  }, [state.tapCount, misleadMode]);

  // Reset on new level
  useEffect(() => {
    setDisplayCount(0);
  }, [level.id]);

  // Decorative rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 40000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  const handleTap = () => {
    if (!isPlaying) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 100);
    onTap();
  };

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

  const timerColor = isFailed
    ? COLORS.danger
    : isLevelComplete
      ? COLORS.accent
      : getTimerColor(progress);

  const strokeDash = CIRCUMFERENCE * progress;

  // Counter color changes erratically
  const counterColor = isPlaying
    ? displayCount % 3 === 0
      ? COLORS.danger
      : displayCount % 2 === 0
        ? COLORS.warning
        : COLORS.white
    : COLORS.white;

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
        {/* Decorative segments */}
        <Animated.View
          style={[styles.ring, { transform: [{ rotate: rotation }] }]}
        >
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const r = 138;
              const len = 18;
              const startAngle = ((angle - len / 2) * Math.PI) / 180;
              const endAngle = ((angle + len / 2) * Math.PI) / 180;
              const cx = RING_SIZE / 2;
              const cy = RING_SIZE / 2;
              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);
              return (
                <Path
                  key={angle}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        </Animated.View>

        {/* Main ring */}
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
          {!isFailed && !isLevelComplete && progress > 0.05 && (
            <Circle
              cx={
                RING_SIZE / 2 +
                RING_RADIUS * Math.cos(((-90 + 360 * progress) * Math.PI) / 180)
              }
              cy={
                RING_SIZE / 2 +
                RING_RADIUS * Math.sin(((-90 + 360 * progress) * Math.PI) / 180)
              }
              r={4}
              fill={timerColor}
            />
          )}
        </Svg>

        {/* Inner circle */}
        <Pressable onPress={handleTap}>
          <View
            style={[
              styles.inner,
              {
                borderColor: isFailed
                  ? "rgba(255,51,85,0.25)"
                  : isLevelComplete
                    ? "rgba(0,255,136,0.25)"
                    : COLORS.innerBorder,
                backgroundColor: isFailed
                  ? "rgba(255,26,26,0.07)"
                  : isLevelComplete
                    ? "rgba(0,255,136,0.07)"
                    : COLORS.innerCircle,
                transform: [{ scale: pressed ? 0.88 : 1 }],
              },
            ]}
          >
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
              <View style={styles.tapContent}>
                <Text style={styles.tapLabel}>TAP</Text>
                <Text style={[styles.tapCount, { color: counterColor }]}>
                  {displayCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

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
    alignItems: "center",
    justifyContent: "center",
  },
  tapContent: {
    alignItems: "center",
  },
  tapLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 4,
    fontFamily: FONTS.regular,
  },
  tapCount: {
    fontSize: 60,
    fontFamily: FONTS.light,
    lineHeight: 68,
    marginTop: 2,
  },
  instructionContainer: { minHeight: 40, justifyContent: "center" },
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

export default memo(MisleadingCounterScreen);