import React, { useState, useEffect, useRef, memo } from "react";
import { View, Pressable, Text, StyleSheet, Animated, PanResponder, GestureResponderEvent } from "react-native";
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

function MultiTouchScreen({
  level, state, progress, onTap, onAction, onContinue, onRetry, onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";
  const [showContinue, setShowContinue] = useState(false);
  const [currentTouches, setCurrentTouches] = useState(0);
  const completedRef = useRef(false);

  const requiredFingers = (level.params.fingerCount as number) ?? 3;

  // Reset on new level
  useEffect(() => {
    if (isPlaying) {
      completedRef.current = false;
      setCurrentTouches(0);
    }
  }, [isPlaying, level.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches?.length ?? 1;
        setCurrentTouches(touches);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches?.length ?? 1;
        setCurrentTouches(touches);
        if (touches === requiredFingers && !completedRef.current) {
          completedRef.current = true;
          // Small delay to let user see the count
          setTimeout(() => onAction("multi_touch"), 200);
        }
      },
      onPanResponderRelease: () => {
        setCurrentTouches(0);
      },
      onPanResponderTerminate: () => {
        setCurrentTouches(0);
      },
    })
  ).current;

  // Decorative rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 40000, useNativeDriver: true })
    ).start();
  }, []);
  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  useEffect(() => {
    if (isFailed) {
      setShowContinue(false);
      const timer = setTimeout(() => setShowContinue(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFailed]);

  const statusScale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (isFailed || isLevelComplete) {
      statusScale.setValue(0.3);
      Animated.spring(statusScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
    }
  }, [isFailed, isLevelComplete]);

  const timerColor = isFailed ? COLORS.danger : isLevelComplete ? COLORS.accent : getTimerColor(progress);
  const strokeDash = CIRCUMFERENCE * progress;

  const touchColor = currentTouches === requiredFingers
    ? COLORS.accent
    : currentTouches > 0
      ? COLORS.warning
      : COLORS.textMuted;

  // Finger dots
  const fingerDots = Array.from({ length: requiredFingers }).map((_, i) => (
    <View
      key={i}
      style={[
        styles.fingerDot,
        {
          backgroundColor: i < currentTouches ? touchColor : "rgba(255,255,255,0.1)",
          borderColor: i < currentTouches ? touchColor : "rgba(255,255,255,0.15)",
        },
      ]}
    />
  ));

  return (
    <View style={styles.playArea}>
      <View style={styles.livesContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={[styles.lifeDot, i < state.lives ? styles.lifeDotActive : styles.lifeDotEmpty]} />
        ))}
      </View>

      <View style={styles.ringContainer}>
        <Animated.View style={[styles.ring, { transform: [{ rotate: rotation }] }]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const r = 138, len = 18;
              const sa = ((angle - len / 2) * Math.PI) / 180;
              const ea = ((angle + len / 2) * Math.PI) / 180;
              const cx = RING_SIZE / 2, cy = RING_SIZE / 2;
              return (
                <Path key={angle}
                  d={`M ${cx + r * Math.cos(sa)} ${cy + r * Math.sin(sa)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(ea)} ${cy + r * Math.sin(ea)}`}
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeLinecap="round" />
              );
            })}
          </Svg>
        </Animated.View>

        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
          <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke={COLORS.ringTrack} strokeWidth={10} />
          <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke={timerColor}
            strokeWidth={isFailed || isLevelComplete ? 10 : 6} strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round" rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
        </Svg>

        <View {...panResponder.panHandlers} style={styles.touchArea}>
          <View style={[styles.inner, {
            borderColor: isFailed ? "rgba(255,51,85,0.25)" : isLevelComplete ? "rgba(0,255,136,0.25)" : `${touchColor}30`,
            backgroundColor: isFailed ? "rgba(255,26,26,0.07)" : isLevelComplete ? "rgba(0,255,136,0.07)" : COLORS.innerCircle,
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
              <View style={styles.touchContent}>
                <Text style={[styles.touchCount, { color: touchColor }]}>{currentTouches}</Text>
                <View style={styles.fingerDotsRow}>
                  {fingerDots}
                </View>
                <Text style={styles.touchLabel}>FINGERS</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.instructionContainer}>
        <Instruction text={level.instruction} failed={isFailed} success={isLevelComplete} />
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
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute" },
  touchArea: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2 },
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  touchContent: { alignItems: "center", gap: 8 },
  touchCount: { fontSize: 56, fontFamily: FONTS.light, lineHeight: 62 },
  fingerDotsRow: { flexDirection: "row", gap: 8 },
  fingerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  touchLabel: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 4, color: COLORS.textMuted },
  instructionContainer: { minHeight: 40, justifyContent: "center" },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default memo(MultiTouchScreen);