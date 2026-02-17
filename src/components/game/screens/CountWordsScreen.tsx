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

const WORD_POOL = ["SUN", "DOG", "ICE", "RUN", "KEY", "EAR", "HAT", "CUP", "BIG", "RED", "FLY", "OWL", "JAM", "FOX", "MAP", "PEN"];

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

function CountWordsScreen({
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
  const [pressed, setPressed] = useState(false);

  const wordCount = (level.params.wordCount as number) ?? 3;

  // Generate scattered word positions (stable per level)
  const words = useMemo(() => {
    const selected: { word: string; x: number; y: number; rotation: number }[] = [];
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
    for (let i = 0; i < wordCount; i++) {
      // Place words within inner circle bounds
      const angle = (Math.PI * 2 * i) / wordCount + (Math.random() * 0.5 - 0.25);
      const dist = 30 + Math.random() * 40;
      selected.push({
        word: shuffled[i % shuffled.length],
        x: dist * Math.cos(angle),
        y: dist * Math.sin(angle),
        rotation: Math.random() * 30 - 15,
      });
    }
    return selected;
  }, [level.id, wordCount]);

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

        <Pressable onPress={handleTap}>
          <View style={[styles.inner, {
            borderColor: isFailed ? "rgba(255,51,85,0.25)" : isLevelComplete ? "rgba(0,255,136,0.25)" : COLORS.innerBorder,
            backgroundColor: isFailed ? "rgba(255,26,26,0.07)" : isLevelComplete ? "rgba(0,255,136,0.07)" : COLORS.innerCircle,
            transform: [{ scale: pressed ? 0.88 : 1 }],
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
              <View style={styles.wordsArea}>
                {words.map((w, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.scatteredWord,
                      {
                        transform: [
                          { translateX: w.x },
                          { translateY: w.y },
                          { rotate: `${w.rotation}deg` },
                        ],
                      },
                    ]}
                  >
                    {w.word}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.instructionContainer}>
        <Instruction
          text={isFailed ? "FAILED" : isLevelComplete ? "NICE!" : "Count the words, tap that many times"}
          failed={isFailed}
          success={isLevelComplete}
        />
        {(isFailed || isLevelComplete) && (
          <Text style={styles.revealText}>Words: {wordCount}</Text>
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
  inner: { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  wordsArea: { position: "relative", width: INNER_SIZE, height: INNER_SIZE, alignItems: "center", justifyContent: "center" },
  scatteredWord: { position: "absolute", fontSize: 14, fontFamily: FONTS.bold, letterSpacing: 2, color: "rgba(255,255,255,0.7)" },
  instructionContainer: { minHeight: 50, justifyContent: "center", alignItems: "center", gap: 4 },
  revealText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 2, color: COLORS.textMuted },
  failButtonsAbsolute: { position: "absolute", bottom: -100, alignItems: "center", gap: 12 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 36, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,51,85,0.2)", backgroundColor: "rgba(255,51,85,0.03)" },
  continueButtonText: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 3, color: COLORS.danger },
  failSecondaryRow: { flexDirection: "row", gap: 24 },
  failSecondaryButton: { paddingVertical: 6, paddingHorizontal: 16 },
  failSecondaryText: { fontSize: 11, fontFamily: FONTS.regular, letterSpacing: 3, color: COLORS.textSecondary },
  failSecondaryDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center" },
});

export default memo(CountWordsScreen);