import React, { useState, useEffect, useRef, useMemo, memo } from "react";
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

const COLOR_OPTIONS: { name: string; hex: string }[] = [
  { name: "red", hex: "#ff3355" },
  { name: "blue", hex: "#4488ff" },
  { name: "green", hex: "#00cc66" },
  { name: "yellow", hex: "#ffcc00" },
  { name: "purple", hex: "#aa55ff" },
  { name: "orange", hex: "#ff8833" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

function AvoidColorScreen({
  level, state, progress, onTap, onAction, onContinue, onRetry, onMenu,
}: Props) {
  const isPlaying = state.status === "playing";
  const isFailed = state.status === "failed";
  const isLevelComplete = state.status === "level_complete";
  const [showContinue, setShowContinue] = useState(false);

  const forbiddenColor = state.memory.previousColor ?? (level.params.forbiddenColor as string) ?? "red";
  const circleCount = (level.params.circleCount as number) ?? 4;

  const circles = useMemo(() => {
    // Ensure forbidden color is present + random others
    const forbidden = COLOR_OPTIONS.find((c) => c.name === forbiddenColor) ?? COLOR_OPTIONS[0];
    const others = shuffle(COLOR_OPTIONS.filter((c) => c.name !== forbiddenColor)).slice(0, circleCount - 1);
    const all = shuffle([forbidden, ...others]);

    const positions = [
      { x: -35, y: -35 }, { x: 35, y: -35 },
      { x: -35, y: 35 }, { x: 35, y: 35 },
      { x: 0, y: -50 }, { x: 0, y: 50 },
    ].slice(0, circleCount);
    const shuffledPos = shuffle(positions);

    return all.map((color, i) => ({
      ...color,
      isForbidden: color.name === forbiddenColor,
      x: shuffledPos[i].x,
      y: shuffledPos[i].y,
    }));
  }, [level.id, forbiddenColor, circleCount]);

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

  const handleCircleTap = (isForbidden: boolean) => {
    if (!isPlaying) return;
    if (isForbidden) {
      onAction("hold_end"); // wrong — forbidden color
    } else {
      onTap(); // correct — safe color
    }
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
          {!isFailed && !isLevelComplete && progress > 0.05 && (
            <Circle
              cx={RING_SIZE / 2 + RING_RADIUS * Math.cos(((-90 + 360 * progress) * Math.PI) / 180)}
              cy={RING_SIZE / 2 + RING_RADIUS * Math.sin(((-90 + 360 * progress) * Math.PI) / 180)}
              r={4} fill={timerColor} />
          )}
        </Svg>

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
                <Path d="M 14 33 Q 18 38 25 44 Q 34 32 48 16" fill="none" stroke={COLORS.accent} strokeWidth={3.5} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          ) : (
            <View style={styles.circlesArea}>
              {circles.map((c, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleCircleTap(c.isForbidden)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c.hex,
                      transform: [{ translateX: c.x }, { translateY: c.y }],
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.instructionContainer}>
        {isFailed ? (
          <View style={styles.revealArea}>
            <Text style={[styles.statusText, { color: COLORS.danger }]}>FAILED</Text>
            <Text style={styles.revealText}>Avoid {forbiddenColor}!</Text>
          </View>
        ) : isLevelComplete ? (
          <Text style={[styles.statusText, { color: COLORS.accent }]}>NICE!</Text>
        ) : (
          <View style={styles.avoidArea}>
            <Text style={styles.avoidInstruction}>
              Tap any color except{" "}
              <Text style={{ color: COLOR_OPTIONS.find((c) => c.name === forbiddenColor)?.hex ?? COLORS.danger }}>
                {forbiddenColor.toUpperCase()}
              </Text>
            </Text>
          </View>
        )}
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
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 1.5, borderColor: COLORS.innerBorder, backgroundColor: COLORS.innerCircle, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  circlesArea: { position: "relative", width: INNER_SIZE, height: INNER_SIZE, alignItems: "center", justifyContent: "center" },
  colorCircle: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "rgba(255,255,255,0.15)" },
  instructionContainer: { minHeight: 50, justifyContent: "center", alignItems: "center" },
  statusText: { fontSize: 22, fontFamily: FONTS.bold, letterSpacing: 2 },
  avoidArea: { alignItems: "center" },
  avoidInstruction: { fontSize: 14, fontFamily: FONTS.bold, letterSpacing: 1, color: COLORS.white, textAlign: "center" },
  revealArea: { alignItems: "center", gap: 4 },
  revealText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 2, color: COLORS.textMuted },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default memo(AvoidColorScreen);