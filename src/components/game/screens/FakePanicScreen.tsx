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

const PANIC_MESSAGES = [
  "TAP NOW!!!", "HURRY!!!", "QUICK TAP!!!", "DO IT NOW!!!",
  "PRESS PRESS!!!", "EMERGENCY!!!", "LAST CHANCE!!!",
];

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

function FakePanicScreen({
  level, state, progress, onTap, onAction, onContinue, onRetry, onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";
  const [showContinue, setShowContinue] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const blinkAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Cycle panic messages
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PANIC_MESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Blinking border
  useEffect(() => {
    if (!isPlaying) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 200, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isPlaying]);

  // Shake
  useEffect(() => {
    if (!isPlaying) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isPlaying]);

  // Pulse scale
  useEffect(() => {
    if (!isPlaying) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 300, useNativeDriver: true }),
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

  const handleTap = () => {
    if (!isPlaying) return;
    onTap(); // validator will fail this
  };

  const statusScale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (isFailed || isLevelComplete) {
      statusScale.setValue(0.3);
      Animated.spring(statusScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
    }
  }, [isFailed, isLevelComplete]);

  const timerColor = isFailed ? COLORS.danger : isLevelComplete ? COLORS.accent : getTimerColor(progress);
  const strokeDash = CIRCUMFERENCE * progress;

  return (
    <Animated.View style={[styles.playArea, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.livesContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={[styles.lifeDot, i < state.lives ? styles.lifeDotActive : styles.lifeDotEmpty]} />
        ))}
      </View>

      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
          <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke={COLORS.ringTrack} strokeWidth={10} />
          <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke={timerColor}
            strokeWidth={isFailed || isLevelComplete ? 10 : 6} strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round" rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
        </Svg>

        <Pressable onPress={handleTap}>
          <Animated.View style={[styles.inner, {
            borderColor: isFailed ? "rgba(255,51,85,0.25)" : isLevelComplete ? "rgba(0,255,136,0.25)" : "rgba(255,51,85,0.4)",
            backgroundColor: isFailed ? "rgba(255,26,26,0.07)" : isLevelComplete ? "rgba(0,255,136,0.07)" : "rgba(255,26,26,0.06)",
            opacity: isFailed || isLevelComplete ? 1 : blinkAnim,
            transform: [{ scale: isFailed || isLevelComplete ? 1 : scaleAnim }],
          }]}>
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
                  <Path d="M 14 33 Q 18 38 25 44 Q 34 32 48 16" fill="none" stroke={COLORS.accent} strokeWidth={3.5} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            ) : (
              <View style={styles.panicContent}>
                <Text style={styles.warningIcon}>⚠</Text>
                <Text style={styles.panicText}>{PANIC_MESSAGES[messageIndex]}</Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.instructionContainer}>
        {isFailed ? (
          <View style={styles.revealArea}>
            <Text style={[styles.statusText, { color: COLORS.danger }]}>FAILED</Text>
            <Text style={styles.revealText}>It was fake panic!</Text>
          </View>
        ) : isLevelComplete ? (
          <View style={styles.revealArea}>
            <Text style={[styles.statusText, { color: COLORS.accent }]}>NICE!</Text>
            <Text style={styles.revealText}>You kept your cool!</Text>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  playArea: { alignItems: "center", gap: 24 },
  livesContainer: { flexDirection: "row", gap: 10 },
  lifeDot: { width: 10, height: 10, borderRadius: 5 },
  lifeDotActive: { backgroundColor: COLORS.accent },
  lifeDotEmpty: { backgroundColor: COLORS.textMuted },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute" },
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  panicContent: { alignItems: "center", gap: 6 },
  warningIcon: { fontSize: 28 },
  panicText: { fontSize: 14, fontFamily: FONTS.bold, letterSpacing: 2, color: COLORS.danger, textAlign: "center", paddingHorizontal: 20 },
  instructionContainer: { minHeight: 50, justifyContent: "center", alignItems: "center" },
  revealArea: { alignItems: "center", gap: 4 },
  statusText: { fontSize: 22, fontFamily: FONTS.bold, letterSpacing: 2 },
  revealText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 2, color: COLORS.textMuted },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default memo(FakePanicScreen);