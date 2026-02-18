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

function CountdownScreen({
  level, state, progress, onTap, onAction, onContinue, onRetry, onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";
  const [showContinue, setShowContinue] = useState(false);
  const [pressed, setPressed] = useState(false);

  const targetSec = (level.params.targetSec as number) ?? 5;
  const tolerance = (level.params.tolerance as number) ?? 0.5;
  const totalSec = level.timeLimit / 1000;
  const elapsed = (level.timeLimit - state.timeRemaining) / 1000;
  const elapsedDisplay = Math.min(elapsed, totalSec).toFixed(1);

  // How close to target
  const diff = Math.abs(elapsed - targetSec);
  const isInZone = diff <= tolerance;
  const isApproaching = diff <= tolerance * 3;

  // Pulse when in zone
  const zoneAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isPlaying || !isInZone) {
      zoneAnim.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(zoneAnim, { toValue: 1.06, duration: 150, useNativeDriver: true }),
        Animated.timing(zoneAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isPlaying, isInZone]);

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

  const handleTap = () => {
    if (!isPlaying) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 100);
    onTap();
  };

  const statusScale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (isFailed || isLevelComplete) {
      statusScale.setValue(0.3);
      Animated.spring(statusScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
    }
  }, [isFailed, isLevelComplete]);

  const timerColor = isFailed
    ? COLORS.danger
    : isLevelComplete
      ? COLORS.accent
      : getTimerColor(progress);

  const strokeDash = CIRCUMFERENCE * progress;

  // Target zone arc on the ring
  const targetStart = targetSec - tolerance;
  const targetEnd = targetSec + tolerance;
  const arcStart = (targetStart / totalSec) * 360 - 90;
  const arcEnd = (targetEnd / totalSec) * 360 - 90;
  const TARGET_R = RING_RADIUS;

  // Elapsed color
  const elapsedColor = isInZone
    ? COLORS.accent
    : isApproaching
      ? COLORS.warning
      : COLORS.white;

  // Inner circle border
  const innerBorderColor = isFailed
    ? "rgba(255,51,85,0.25)"
    : isLevelComplete
      ? "rgba(0,255,136,0.25)"
      : isInZone
        ? "rgba(0,255,136,0.3)"
        : isApproaching
          ? "rgba(255,204,0,0.15)"
          : COLORS.innerBorder;

  const innerBg = isFailed
    ? "rgba(255,26,26,0.07)"
    : isLevelComplete
      ? "rgba(0,255,136,0.07)"
      : isInZone
        ? "rgba(0,255,136,0.04)"
        : COLORS.innerCircle;

  // Target arc path
  const arcStartRad = (arcStart * Math.PI) / 180;
  const arcEndRad = (arcEnd * Math.PI) / 180;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const x1 = cx + TARGET_R * Math.cos(arcStartRad);
  const y1 = cy + TARGET_R * Math.sin(arcStartRad);
  const x2 = cx + TARGET_R * Math.cos(arcEndRad);
  const y2 = cy + TARGET_R * Math.sin(arcEndRad);
  const largeArc = arcEnd - arcStart > 180 ? 1 : 0;
  const targetArcD = `M ${x1} ${y1} A ${TARGET_R} ${TARGET_R} 0 ${largeArc} 1 ${x2} ${y2}`;

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
              return (
                <Path key={angle}
                  d={`M ${cx + r * Math.cos(sa)} ${cy + r * Math.sin(sa)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(ea)} ${cy + r * Math.sin(ea)}`}
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeLinecap="round" />
              );
            })}
          </Svg>
        </Animated.View>

        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
          {/* Track */}
          <Circle cx={cx} cy={cy} r={RING_RADIUS} fill="none" stroke={COLORS.ringTrack} strokeWidth={10} />
          {/* Timer arc */}
          <Circle cx={cx} cy={cy} r={RING_RADIUS} fill="none" stroke={timerColor}
            strokeWidth={isFailed || isLevelComplete ? 10 : 6} strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round" rotation={-90} origin={`${cx}, ${cy}`} />
          {/* Target zone highlight */}
          {isPlaying && (
            <Path d={targetArcD} fill="none"
              stroke={isInZone ? COLORS.accent : "rgba(0,255,136,0.25)"}
              strokeWidth={isInZone ? 14 : 10}
              strokeLinecap="round" />
          )}
          {/* Timer dot */}
          {!isFailed && !isLevelComplete && progress > 0.05 && (
            <Circle
              cx={cx + RING_RADIUS * Math.cos(((-90 + 360 * progress) * Math.PI) / 180)}
              cy={cy + RING_RADIUS * Math.sin(((-90 + 360 * progress) * Math.PI) / 180)}
              r={4} fill={timerColor} />
          )}
        </Svg>

        <Pressable onPress={handleTap}>
          <Animated.View style={[styles.inner, {
            borderColor: innerBorderColor,
            backgroundColor: innerBg,
            transform: [
              { scale: isFailed || isLevelComplete ? 1 : pressed ? 0.88 : zoneAnim },
            ],
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
              <View style={styles.timerContent}>
                <Text style={[styles.elapsedTime, { color: elapsedColor }]}>
                  {elapsedDisplay}
                </Text>
                <Text style={styles.targetLabel}>
                  TAP AT {targetSec.toFixed(1)}s
                </Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
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
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  timerContent: { alignItems: "center", gap: 8 },
  elapsedTime: { fontSize: 56, fontFamily: FONTS.light, lineHeight: 62 },
  targetLabel: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.textMuted },
  instructionContainer: { minHeight: 40, justifyContent: "center" },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default memo(CountdownScreen);