import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { View, Pressable, StyleSheet, Animated } from "react-native";
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

function holdColor(p: number): string {
    if (p < 0.6) return COLORS.accent;
    if (p < 0.85) return COLORS.warning;
    return COLORS.danger;
}

type HoldMode = "fill" | "exact" | "min" | "max";

function getHoldInstruction(mode: HoldMode, targetSec: number): string {
    switch (mode) {
        case "exact": return `Release at ~${targetSec.toFixed(1)}s`;
        case "min": return `Hold at least ${targetSec.toFixed(1)}s`;
        case "max": return `Release before ${targetSec.toFixed(1)}s`;
        default: return "Hold until full";
    }
}

function HoldScreen({
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
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

    const holdStartRef = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completedRef = useRef(false);

    // Hold config from level params
    const holdDuration = ((level.params.holdDuration as number) ?? 2.5) * 1000;
    const targetPercent = (level.params.targetPercent as number) ?? 1.0;
    const holdMode = (level.params.holdMode as HoldMode) ?? "fill";
    const targetSec = (level.params.targetSec as number) ?? (holdDuration / 1000);
    const tolerance = (level.params.tolerance as number) ?? 0.4;

    // Reset on new level
    useEffect(() => {
        setHoldProgress(0);
        setIsHolding(false);
        completedRef.current = false;
    }, [level.id]);

    useEffect(() => {
        if (isFailed) {
            setShowContinue(false);
            const timer = setTimeout(() => setShowContinue(true), 800);
            return () => clearTimeout(timer);
        }
    }, [isFailed]);

    // Cleanup interval
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startHold = useCallback(() => {
        if (!isPlaying || completedRef.current) return;
        setIsHolding(true);
        holdStartRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - holdStartRef.current;
            const p = Math.min(elapsed / holdDuration, 1);
            setHoldProgress(p);

            if (holdMode === "fill" && p >= targetPercent) {
                // Fill mode: auto-complete at target
                completedRef.current = true;
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsHolding(false);
                onTap();
            }

            if (holdMode === "max") {
                // Max mode: fail if held past target
                const elapsedSec = (Date.now() - holdStartRef.current) / 1000;
                if (elapsedSec > targetSec) {
                    completedRef.current = true;
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setIsHolding(false);
                    onAction("hold_end");
                }
            }
        }, 16);
    }, [isPlaying, holdDuration, targetPercent, onTap]);

    const endHold = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!isHolding || completedRef.current) return;
        setIsHolding(false);
        completedRef.current = true;

        const elapsedSec = (Date.now() - holdStartRef.current) / 1000;

        if (holdMode === "fill") {
            // Fill mode: released before target = fail
            onAction("hold_end");
            return;
        }

        if (holdMode === "exact") {
            // Exact mode: release within tolerance of target
            if (Math.abs(elapsedSec - targetSec) <= tolerance) {
                onTap(); // success
            } else {
                onAction("hold_end"); // fail
            }
            return;
        }

        if (holdMode === "min") {
            // Min mode: must hold at least targetSec
            if (elapsedSec >= targetSec) {
                onTap(); // success
            } else {
                onAction("hold_end"); // fail
            }
            return;
        }

        if (holdMode === "max") {
            // Max mode: must release before targetSec
            if (elapsedSec < targetSec) {
                onTap(); // success
            } else {
                onAction("hold_end"); // fail
            }
            return;
        }

        onAction("hold_end");
    }, [isHolding, onAction, onTap, holdMode, targetSec, tolerance]);

    // Derived values
    const timerColor = isFailed
        ? COLORS.danger
        : isLevelComplete
            ? COLORS.accent
            : getTimerColor(progress);

    const strokeDash = CIRCUMFERENCE * progress;
    const hColor = holdColor(holdProgress);
    const fillPercent = Math.min(holdProgress / targetPercent * 100, 100);
    const pctDisplay = Math.round(fillPercent);
    const elapsed = ((holdProgress * holdDuration) / 1000).toFixed(1);

    // Fill animation value
    const fillHeight = useRef(new Animated.Value(0)).current;
    const scanOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fillHeight.setValue(fillPercent);
        scanOpacity.setValue(isHolding && fillPercent > 2 ? 1 : 0);
    }, [fillPercent, isHolding]);

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

    const innerBorderColor = isFailed
        ? "rgba(255,51,85,0.25)"
        : isLevelComplete
            ? "rgba(0,255,136,0.25)"
            : isHolding
                ? `${hColor}40`
                : COLORS.innerBorder;

    const innerBg = isFailed
        ? "rgba(255,26,26,0.07)"
        : isLevelComplete
            ? "rgba(0,255,136,0.07)"
            : COLORS.innerCircle;

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

            {/* Ring + Hold Zone */}
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

                {/* Main ring SVG */}
                <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={142}
                        fill="none"
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth={0.5}
                        strokeDasharray="4 8"
                    />
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        fill="none"
                        stroke={COLORS.ringTrack}
                        strokeWidth={10}
                    />
                    {/* Timer glow layers */}
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        fill="none"
                        stroke={timerColor}
                        strokeWidth={18}
                        strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                        strokeLinecap="round"
                        strokeOpacity={0.06}
                        rotation={-90}
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                    />
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        fill="none"
                        stroke={timerColor}
                        strokeWidth={12}
                        strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                        strokeLinecap="round"
                        strokeOpacity={0.1}
                        rotation={-90}
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                    />
                    {/* Timer arc */}
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
                    {/* Endpoint dot */}
                    {!isFailed && !isLevelComplete && progress > 0.05 && (
                        <Circle
                            cx={
                                RING_SIZE / 2 +
                                RING_RADIUS *
                                Math.cos(((-90 + 360 * progress) * Math.PI) / 180)
                            }
                            cy={
                                RING_SIZE / 2 +
                                RING_RADIUS *
                                Math.sin(((-90 + 360 * progress) * Math.PI) / 180)
                            }
                            r={4}
                            fill={timerColor}
                        />
                    )}
                </Svg>

                {/* Inner circle with hold zone */}
                <View
                    style={[
                        styles.inner,
                        {
                            backgroundColor: innerBg,
                            borderColor: innerBorderColor,
                        },
                    ]}
                >
                    <Pressable
                        style={styles.innerPressable}
                        onPressIn={startHold}
                        onPressOut={endHold}
                    >
                        {/* Rising fill layer */}
                        {holdProgress > 0 && !isFailed && !isLevelComplete && (
                            <View
                                style={[
                                    styles.fillLayer,
                                    {
                                        height: `${fillPercent}%`,
                                        backgroundColor: `${hColor}15`,
                                    },
                                ]}
                            >
                                {/* Gradient overlay for depth */}
                                <View
                                    style={[
                                        styles.fillGradient,
                                        {
                                            backgroundColor: `${hColor}08`,
                                        },
                                    ]}
                                />
                            </View>
                        )}

                        {/* Scan line at top of fill */}
                        {isHolding && fillPercent > 2 && !isFailed && !isLevelComplete && (
                            <View
                                style={[
                                    styles.scanLine,
                                    {
                                        bottom: `${fillPercent}%`,
                                        backgroundColor: `${hColor}90`,
                                        shadowColor: hColor,
                                    },
                                ]}
                            />
                        )}

                        {/* Content */}
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
                            <View style={styles.holdContent}>
                                <Animated.Text
                                    style={[
                                        styles.holdLabel,
                                        { color: isHolding ? hColor : COLORS.textSecondary },
                                    ]}
                                >
                                    HOLD
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.holdTime,
                                        { color: isHolding ? COLORS.white : COLORS.white },
                                    ]}
                                >
                                    {elapsed}s
                                </Animated.Text>
                                {holdMode === "fill" ? (
                                    <Animated.Text
                                        style={[styles.holdPercent, { color: `${hColor}` }]}
                                    >
                                        {pctDisplay}%
                                    </Animated.Text>
                                ) : (
                                    <Animated.Text
                                        style={[styles.holdTarget, { color: COLORS.textSecondary }]}
                                    >
                                        {getHoldInstruction(holdMode, targetSec)}
                                    </Animated.Text>
                                )}
                            </View>
                        )}
                    </Pressable>
                </View>
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
                        <Animated.Text style={styles.continueButtonText}>CONTINUE</Animated.Text>
                    </Pressable>
                    <View style={styles.failSecondaryRow}>
                        <Pressable style={styles.failSecondaryButton} onPress={onRetry}>
                            <Animated.Text style={styles.failSecondaryText}>RETRY</Animated.Text>
                        </Pressable>
                        <View style={styles.failSecondaryDivider} />
                        <Pressable style={styles.failSecondaryButton} onPress={onMenu}>
                            <Animated.Text style={styles.failSecondaryText}>MENU</Animated.Text>
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
        overflow: "hidden",
    },
    innerPressable: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    fillLayer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    fillGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    scanLine: {
        position: "absolute",
        left: "10%",
        right: "10%",
        height: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
    },
    holdContent: {
        alignItems: "center",
        zIndex: 2,
    },
    holdLabel: {
        fontSize: 11,
        letterSpacing: 4,
        fontFamily: FONTS.regular,
        textTransform: "uppercase",
    },
    holdTime: {
        fontSize: 48,
        fontFamily: FONTS.light,
        lineHeight: 54,
        marginTop: 2,
    },
    holdPercent: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        letterSpacing: 2,
        marginTop: 2,
    },
    holdTarget: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        letterSpacing: 2,
        marginTop: 4,
        textAlign: "center",
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

export default memo(HoldScreen);