import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { View, Pressable, StyleSheet, Animated, Text } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Instruction from "../Instruction";
import { COLORS, getTimerColor } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState, ActionType } from "../../../engine/types";


const RING_RADIUS = 120;
const RING_SIZE = 300;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_SIZE = 200;
const HOLD_RING_R = 106;
const HOLD_RING_CIRC = 2 * Math.PI * HOLD_RING_R;

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

function HoldReleaseScreen({
  level, state, progress, onTap, onAction, onContinue, onRetry, onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";
  const [showContinue, setShowContinue] = useState(false);

  const barDurationMs = (level.params.barDurationMs as number) ?? 3000;
  const zonePercent = (level.params.zonePercent as number) ?? 20;

  // Random zone position (percentage along the bar where zone starts)
  const zoneStart = useMemo(() => {
    const maxStart = 100 - zonePercent;
    return Math.floor(Math.random() * maxStart);
  }, [level.id, zonePercent]);
  const zoneEnd = zoneStart + zonePercent;

  // Hold tracking
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdProgressRef = useRef(0);
  const holdStartTime = useRef<number | null>(null);
  const completedRef = useRef(false);
  const zoneStartRef = useRef(zoneStart);
  const zoneEndRef = useRef(zoneEnd);

  // Reset on new level
  useEffect(() => {
    if (isPlaying) {
      setHolding(false);
      setHoldProgress(0);
      holdProgressRef.current = 0;
      holdStartTime.current = null;
      completedRef.current = false;
      zoneStartRef.current = zoneStart;
      zoneEndRef.current = zoneEnd;
    }
  }, [isPlaying, level.id, zoneStart, zoneEnd]);

  // Hold progress timer
  useEffect(() => {
    if (!holding || !isPlaying) return;

    const interval = setInterval(() => {
      if (!holdStartTime.current || completedRef.current) return;
      const elapsed = Date.now() - holdStartTime.current;
      const prog = Math.min(elapsed / barDurationMs, 1);
      holdProgressRef.current = prog;
      setHoldProgress(prog);

      if (prog >= 1) {
        // Bar filled — too late
        completedRef.current = true;
        clearInterval(interval);
        onAction("hold_start");
      }
    }, 30);

    return () => clearInterval(interval);
  }, [holding, isPlaying, barDurationMs, onAction]);

  const handleRelease = () => {
    if (completedRef.current || !holdStartTime.current) return;
    completedRef.current = true;
    setHolding(false);

    const progressPercent = holdProgressRef.current * 100;
    if (progressPercent >= zoneStartRef.current && progressPercent <= zoneEndRef.current) {
      onTap();
    } else {
      onAction("hold_end");
    }
  };

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
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  // Hold ring progress
  const holdStrokeDash = HOLD_RING_CIRC * holdProgress;

  // Zone arc on hold ring (counter-clockwise, so we flip angles)
  const zoneStartAngle = 90 + (zoneStart / 100) * 360;
  const zoneEndAngle = 90 + (zoneEnd / 100) * 360;
  const zoneStartRad = (zoneStartAngle * Math.PI) / 180;
  const zoneEndRad = (zoneEndAngle * Math.PI) / 180;
  const zx1 = cx + HOLD_RING_R * Math.cos(zoneStartRad);
  const zy1 = cy + HOLD_RING_R * Math.sin(zoneStartRad);
  const zx2 = cx + HOLD_RING_R * Math.cos(zoneEndRad);
  const zy2 = cy + HOLD_RING_R * Math.sin(zoneEndRad);
  const zoneLargeArc = zoneEndAngle - zoneStartAngle > 180 ? 1 : 0;
  const zoneArcD = `M ${zx1} ${zy1} A ${HOLD_RING_R} ${HOLD_RING_R} 0 ${zoneLargeArc} 1 ${zx2} ${zy2}`;

  // Progress in zone check for coloring
  const progressPercent = holdProgress * 100;
  const inZone = progressPercent >= zoneStart && progressPercent <= zoneEnd;
  const pastZone = progressPercent > zoneEnd;

  const holdColor = pastZone
    ? COLORS.danger
    : inZone
      ? COLORS.accent
      : COLORS.warning;

  // Inner circle label
  const innerLabel = !holding && holdProgress === 0
    ? "HOLD"
    : inZone
      ? "RELEASE!"
      : holding
        ? "HOLD..."
        : "HOLD";

  const innerLabelColor = inZone ? COLORS.accent : pastZone ? COLORS.danger : COLORS.warning;

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
          {/* Main timer ring */}
          <Circle cx={cx} cy={cy} r={RING_RADIUS} fill="none" stroke={COLORS.ringTrack} strokeWidth={10} />
          <Circle cx={cx} cy={cy} r={RING_RADIUS} fill="none" stroke={timerColor}
            strokeWidth={isFailed || isLevelComplete ? 10 : 6} strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round" rotation={-90} origin={`${cx}, ${cy}`} />
          {!isFailed && !isLevelComplete && progress > 0.05 && (
            <Circle
              cx={cx + RING_RADIUS * Math.cos(((-90 + 360 * progress) * Math.PI) / 180)}
              cy={cy + RING_RADIUS * Math.sin(((-90 + 360 * progress) * Math.PI) / 180)}
              r={4} fill={timerColor} />
          )}

          {/* Hold ring track */}
          <Circle cx={cx} cy={cy} r={HOLD_RING_R} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={4} />

          {/* Target zone arc */}
          {isPlaying && (
            <Path d={zoneArcD} fill="none"
              stroke={inZone ? "rgba(0,255,136,0.5)" : "rgba(0,255,136,0.2)"}
              strokeWidth={inZone ? 10 : 8}
              strokeLinecap="round" />
          )}

          {/* Hold progress (counter-clockwise from top) */}
          {isPlaying && holding && holdProgress > 0 && (
            <Circle cx={cx} cy={cy} r={HOLD_RING_R} fill="none"
              stroke={holdColor} strokeWidth={4}
              strokeDasharray={`${holdStrokeDash} ${HOLD_RING_CIRC}`}
              strokeLinecap="round" rotation={90}
              origin={`${cx}, ${cy}`} />
          )}
        </Svg>

        <Pressable
          onPressIn={() => {
            if (!isPlaying || completedRef.current) return;
            holdStartTime.current = Date.now();
            setHolding(true);
          }}
          onPressOut={() => handleRelease()}
          style={styles.touchArea}
        >
          <View style={[styles.inner, {
            borderColor: isFailed ? "rgba(255,51,85,0.25)" : isLevelComplete ? "rgba(0,255,136,0.25)" : holding ? `${holdColor}30` : COLORS.innerBorder,
            backgroundColor: isFailed ? "rgba(255,26,26,0.07)" : isLevelComplete ? "rgba(0,255,136,0.07)" : COLORS.innerCircle,
            transform: [{ scale: holding ? 0.93 : 1 }],
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
              <View style={styles.holdContent}>
                <Text style={[styles.holdLabel, { color: innerLabelColor }]}>
                  {innerLabel}
                </Text>
                <Text style={styles.holdPercent}>
                  {Math.round(holdProgress * 100)}%
                </Text>
              </View>
            )}
          </View>
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
  touchArea: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2 },
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  holdContent: { alignItems: "center", gap: 8 },
  holdLabel: { fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 6 },
  holdPercent: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 2, color: COLORS.textMuted },
  instructionContainer: { minHeight: 40, justifyContent: "center" },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default React.memo(HoldReleaseScreen);
