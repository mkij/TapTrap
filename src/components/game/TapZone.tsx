import React, { useRef, useCallback, useEffect, memo } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";
import { COLORS, getTimerColor } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";

const RING_RADIUS = 120;
const RING_SIZE = 300;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const INNER_SIZE = 200;

interface TapZoneProps {
    progress: number;
    tapCount: number;
    disabled: boolean;
    failed: boolean;
    success: boolean;
    onTap: () => void;
}

function TapZone({
    progress,
    tapCount,
    disabled,
    failed,
    success,
    onTap,
}: TapZoneProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const borderPulseAnim = useRef(new Animated.Value(0)).current;
    const tapRingScale = useRef(new Animated.Value(1)).current;
    const tapRingOpacity = useRef(new Animated.Value(0)).current;
    const statusScale = useRef(new Animated.Value(0.3)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const tapPosition = useRef({ x: 0, y: 0 }).current;

    const PARTICLE_COUNT = 8;
    const particleAnims = useRef(
        Array.from({ length: PARTICLE_COUNT }, () => ({
            progress: new Animated.Value(1),
            angle: 0,
        }))
    ).current;
    // Slow rotation for decorative segments
    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 40000,
                useNativeDriver: true,
            })
        ).start();
    }, [rotateAnim]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    // Fail/success bounce
    useEffect(() => {
        if (failed || success) {
            statusScale.setValue(0.3);
            Animated.spring(statusScale, {
                toValue: 1,
                friction: 4,
                tension: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [failed, success]);

    const timerColor = failed
        ? COLORS.danger
        : success
            ? COLORS.accent
            : getTimerColor(progress);

    const strokeDash = CIRCUMFERENCE * progress;

    // Border pulse when time is low
    useEffect(() => {
        if (disabled || failed || success) {
            borderPulseAnim.stopAnimation();
            borderPulseAnim.setValue(0);
            return;
        }

        if (progress < 0.25) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(borderPulseAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(borderPulseAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else if (progress < 0.5) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(borderPulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(borderPulseAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            borderPulseAnim.stopAnimation();
            borderPulseAnim.setValue(0);
        }
    }, [progress < 0.25, progress < 0.5, disabled, failed, success]);

    const handlePress = useCallback(() => {
        if (disabled) return;

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.88,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Burst particles
        particleAnims.forEach((p, i) => {
            p.angle = (i * 360) / PARTICLE_COUNT + (Math.random() * 20 - 10);
            p.progress.setValue(0);
            Animated.timing(p.progress, {
                toValue: 1,
                duration: 500 + Math.random() * 200,
                useNativeDriver: true,
            }).start();
        });

        // Tap ring pulse
        tapRingScale.setValue(1);
        tapRingOpacity.setValue(0.4);
        Animated.parallel([
            Animated.timing(tapRingScale, {
                toValue: 1.8,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(tapRingOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        onTap();
    }, [disabled, onTap, scaleAnim, tapRingScale, tapRingOpacity]);

    const borderPulseOpacity = borderPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const innerBorderColor = failed
        ? "rgba(255,51,85,0.25)"
        : success
            ? "rgba(0,255,136,0.25)"
            : COLORS.innerBorder;

    const innerBg = failed
        ? "rgba(255,26,26,0.07)"
        : success
            ? "rgba(0,255,136,0.07)"
            : COLORS.innerCircle;

    return (
        <View style={styles.container}>
            {/* Rotating decorative segments */}
            <Animated.View
                style={[
                    styles.ring,
                    { transform: [{ rotate: rotation }] },
                ]}
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
                {/* Outer dashed ring */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={142}
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={0.5}
                    strokeDasharray="4 8"
                />

                {/* Background track */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={COLORS.ringTrack}
                    strokeWidth={10}
                />

                {/* Progress arc glow - outer */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={28}
                    strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    strokeOpacity={0.04}
                    rotation={-90}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />

                {/* Progress arc glow - mid */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={18}
                    strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    strokeOpacity={0.08}
                    rotation={-90}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />

                {/* Progress arc glow - inner */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={12}
                    strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    strokeOpacity={0.12}
                    rotation={-90}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />

                {/* Progress arc */}
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={failed || success ? 10 : 6}
                    strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    rotation={-90}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />

                {/* Endpoint dot */}
                {!failed && !success && progress > 0.05 && (
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

            {/* Tap burst particles */}
            {particleAnims.map((p, i) => {
                const translateX = p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                        tapPosition.x,
                        tapPosition.x + 60 * Math.cos((p.angle * Math.PI) / 180),
                    ],
                });
                const translateY = p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                        tapPosition.y,
                        tapPosition.y + 60 * Math.sin((p.angle * Math.PI) / 180),
                    ],
                });
                const opacity = p.progress.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.8, 0.6, 0],
                });
                const scale = p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.3],
                });
                return (
                    <Animated.View
                        key={i}
                        style={{
                            position: "absolute",
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: timerColor,
                            opacity,
                            transform: [{ translateX }, { translateY }, { scale }],
                        }}
                    />
                );
            })}

            {/* Tap ring pulse */}
            <Animated.View
                style={{
                    position: "absolute",
                    width: INNER_SIZE,
                    height: INNER_SIZE,
                    borderRadius: INNER_SIZE / 2,
                    borderWidth: 2,
                    borderColor: timerColor,
                    opacity: tapRingOpacity,
                    transform: [{ scale: tapRingScale }],
                }}
            />

            {/* Border pulse overlay */}
            {!failed && !success && progress < 0.5 && (
                <Animated.View
                    style={{
                        position: "absolute",
                        width: INNER_SIZE,
                        height: INNER_SIZE,
                        borderRadius: INNER_SIZE / 2,
                        borderWidth: 2,
                        borderColor: "rgba(255,255,255,0.15)",
                        opacity: borderPulseOpacity,
                    }}
                />
            )}

            {/* Inner tap circle */}
            <Animated.View
                style={[
                    styles.inner,
                    {
                        backgroundColor: innerBg,
                        borderColor: innerBorderColor,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Pressable
                    onPressIn={(e) => {
                        const cx = RING_SIZE / 2;
                        const cy = RING_SIZE / 2;
                        const innerOffset = (RING_SIZE - INNER_SIZE) / 2;
                        tapPosition.x = e.nativeEvent.locationX + innerOffset - cx;
                        tapPosition.y = e.nativeEvent.locationY + innerOffset - cy;
                        handlePress();
                    }}
                    style={styles.innerPressable}
                >
                    {failed || success ? (
                        <Animated.View style={{ transform: [{ scale: statusScale }] }}>
                            <Svg width={60} height={60} viewBox="0 0 60 60">
                                {failed ? (
                                    <>
                                        <Line
                                            x1={15} y1={15} x2={45} y2={45}
                                            stroke={COLORS.danger}
                                            strokeWidth={4}
                                            strokeLinecap="round"
                                        />
                                        <Line
                                            x1={45} y1={15} x2={15} y2={45}
                                            stroke={COLORS.danger}
                                            strokeWidth={4}
                                            strokeLinecap="round"
                                        />
                                    </>
                                ) : (
                                    <Path
                                        d="M 14 33 Q 18 38 25 44 Q 34 32 48 16"
                                        fill="none"
                                        stroke={COLORS.accent}
                                        strokeWidth={3.5}
                                        strokeLinecap="round"
                                    />
                                )}
                            </Svg>
                        </Animated.View>
                    ) : (
                        <>
                            <Animated.Text style={styles.tapLabel}>TAP</Animated.Text>
                            <Animated.Text
                                style={[
                                    styles.counter,
                                    tapCount > 0 && { color: timerColor },
                                ]}
                            >
                                {tapCount}
                            </Animated.Text>
                        </>
                    )}
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
    },
    ring: {
        position: "absolute",
    },
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
    tapLabel: {
        fontSize: 11,
        letterSpacing: 4,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
        textTransform: "uppercase",
    },
    counter: {
        fontSize: 60,
        fontWeight: undefined,
        color: COLORS.white,
        fontFamily: FONTS.light,
        lineHeight: 66,
        marginTop: 2,
    },
    counterFailed: {
        color: COLORS.danger,
        fontSize: 48,
        fontFamily: FONTS.bold,
    },
    counterSuccess: {
        color: COLORS.accent,
        fontSize: 48,
        fontFamily: FONTS.bold,
    },
});

export default memo(TapZone);