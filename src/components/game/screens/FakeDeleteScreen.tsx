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

function FakeDeleteScreen({
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
  const [phase, setPhase] = useState<"deleting" | "confirm">("deleting");
  const [fakeProgress, setFakeProgress] = useState(0);

  const deleteAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Phase transitions
  useEffect(() => {
    if (!isPlaying) return;
    setPhase("deleting");
    setFakeProgress(0);

    // Fake progress bar
    const progressInterval = setInterval(() => {
      setFakeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);

    // Switch to confirm phase after 2s
    const phaseTimer = setTimeout(() => {
      setPhase("confirm");
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(phaseTimer);
    };
  }, [level.id, isPlaying]);

  // Blinking warning
  useEffect(() => {
    if (!isPlaying) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isPlaying]);

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  const handleFakePress = () => {
    if (!isPlaying) return;
    onTap(); // validator fails this
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
  const cappedProgress = Math.min(fakeProgress, 100);

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
          ) : phase === "deleting" ? (
            <View style={styles.deleteContent}>
              <Animated.Text style={[styles.warningIcon, { opacity: blinkAnim }]}>
                ⚠
              </Animated.Text>
              <Text style={styles.deleteTitle}>DELETING</Text>
              <Text style={styles.deleteSubtitle}>save data...</Text>

              {/* Fake progress bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${cappedProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(cappedProgress)}%</Text>
            </View>
          ) : (
            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>DELETE ALL?</Text>
              <Text style={styles.confirmSubtitle}>This cannot be undone</Text>
              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelBtn} onPress={handleFakePress}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </Pressable>
                <Pressable style={styles.okBtn} onPress={handleFakePress}>
                  <Text style={styles.okText}>OK</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Instruction area */}
      <View style={styles.instructionContainer}>
        {isFailed ? (
          <Text style={[styles.statusText, { color: COLORS.danger }]}>FAILED</Text>
        ) : isLevelComplete ? (
          <View style={styles.revealArea}>
            <Text style={[styles.statusText, { color: COLORS.accent }]}>NICE!</Text>
            <Text style={styles.revealText}>It was fake!</Text>
          </View>
        ) : null}
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
    borderColor: "rgba(255,51,85,0.2)",
    backgroundColor: "rgba(255,26,26,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteContent: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
  },
  warningIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  deleteTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 4,
    color: COLORS.danger,
  },
  deleteSubtitle: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.danger,
  },
  progressText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  confirmContent: {
    alignItems: "center",
    gap: 6,
  },
  confirmTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 3,
    color: COLORS.danger,
  },
  confirmSubtitle: {
    fontSize: 9,
    fontFamily: FONTS.regular,
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cancelText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.textSecondary,
  },
  okBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,51,85,0.3)",
    backgroundColor: "rgba(255,51,85,0.08)",
  },
  okText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.danger,
  },
  instructionContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  revealArea: {
    alignItems: "center",
    gap: 4,
  },
  revealText: {
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

export default memo(FakeDeleteScreen);