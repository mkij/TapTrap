import React, { useState, useEffect, useRef, memo } from "react";
import { View, Pressable, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Instruction from "../Instruction";
import { COLORS, getTimerColor } from "../../../constants/colors";
import { FONTS } from "../../../constants/fonts";
import { Level, GameState, ActionType } from "../../../engine/types";

const RING_RADIUS = 120;
const RING_SIZE = 300;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_SIZE = 200;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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

function JumpscareScreen({
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
    const [scared, setScared] = useState(false);

    const scareDelay = ((level.params.scareDelay as number) ?? 1.5) * 1000;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scareScale = useRef(new Animated.Value(0)).current;
    const scareOpacity = useRef(new Animated.Value(0)).current;

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

    // Trigger jumpscare
    useEffect(() => {
        if (!isPlaying) return;
        setScared(false);
        scareScale.setValue(0);
        scareOpacity.setValue(0);
        flashAnim.setValue(0);

        const timer = setTimeout(() => {
            setScared(true);

            // Flash
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
                Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(flashAnim, { toValue: 0.6, duration: 50, useNativeDriver: true }),
                Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();

            // Scare icon pop
            Animated.parallel([
                Animated.spring(scareScale, {
                    toValue: 1,
                    friction: 3,
                    tension: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scareOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Shake
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 5, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -5, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();

            // Fade scare after a moment
            setTimeout(() => {
                Animated.timing(scareOpacity, {
                    toValue: 0.15,
                    duration: 800,
                    useNativeDriver: true,
                }).start();
            }, 600);
        }, scareDelay);

        return () => clearTimeout(timer);
    }, [level.id, isPlaying]);

    useEffect(() => {
        if (isFailed) {
            setShowContinue(false);
            const timer = setTimeout(() => setShowContinue(true), 800);
            return () => clearTimeout(timer);
        }
    }, [isFailed]);

    const handleTap = () => {
        if (!isPlaying || !scared) return;
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

    const scareTexts = ["ERROR", "!!!!", "STOP", "NO!", "DANGER"];
    const scareText = scareTexts[level.id % scareTexts.length];

    return (
        <Animated.View style={[styles.playArea, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Flash overlay */}
            <Animated.View
                style={[
                    styles.flashOverlay,
                    { opacity: flashAnim },
                ]}
                pointerEvents="none"
            />

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
                                    stroke={scared ? "rgba(255,51,85,0.15)" : "rgba(255,255,255,0.08)"}
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

                {/* Scare text behind circle */}
                {scared && isPlaying && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.scareContainer,
                            {
                                opacity: scareOpacity,
                                transform: [{ scale: scareScale }],
                            },
                        ]}
                    >
                        <Text style={styles.scareText}>{scareText}</Text>
                    </Animated.View>
                )}

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
                                        : scared
                                            ? "rgba(255,51,85,0.15)"
                                            : COLORS.innerBorder,
                                backgroundColor: isFailed
                                    ? "rgba(255,26,26,0.07)"
                                    : isLevelComplete
                                        ? "rgba(0,255,136,0.07)"
                                        : COLORS.innerCircle,
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
                        ) : scared ? (
                            <View style={styles.tapContent}>
                                <Text style={styles.tapLabel}>TAP</Text>
                                <Text style={styles.tapCount}>{state.tapCount}</Text>
                            </View>
                        ) : (
                            <View style={styles.tapContent}>
                                <Text style={[styles.tapLabel, { opacity: 0.15 }]}>. . .</Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            </View>

            <View style={styles.instructionContainer}>
                <Instruction
                    text={isFailed || isLevelComplete ? level.instruction : scared ? level.instruction : ""}
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
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    playArea: { alignItems: "center", gap: 24 },
    flashOverlay: {
        position: "absolute",
        top: -200,
        left: -50,
        right: -50,
        bottom: -200,
        backgroundColor: "#ff3355",
        zIndex: 100,
    },
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
    scareContainer: {
        position: "absolute",
        zIndex: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    scareText: {
        fontSize: 72,
        fontFamily: FONTS.bold,
        color: COLORS.danger,
        letterSpacing: -2,
    },
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
        color: COLORS.white,
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

export default memo(JumpscareScreen);