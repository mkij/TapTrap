import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TapZone from "../components/game/TapZone";
import Instruction from "../components/game/Instruction";
import ScoreBar from "../components/game/ScoreBar";
import useGameLoop from "../hooks/useGameLoop";
import { COLORS } from "../constants/colors";
import AmbientBackground from "../components/game/AmbientBackground";
import { useHaptics } from "../hooks/useHaptics";
import { FONTS } from "../constants/fonts";
import SettingsScreen from "./SettingsScreen";
import ScreenRenderer from "../components/game/ScreenRenderer";
import DevScreen from "./DevScreen";
import { Category } from "../engine/types";


export default function GameScreen() {
    const {
        state,
        level,
        progress,
        highScore,
        setHighScore,
        handleTap,
        handleAction,
        startGame,
        continueGame,
        resetGame,
        startTestCategory,
        startTestScreen,
    } = useGameLoop();

    const haptics = useHaptics();

    const [showSettings, setShowSettings] = useState(false);
    const [showDev, setShowDev] = useState(false);
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
    const [showIntro, setShowIntro] = useState(false);

    // Check first launch
    useEffect(() => {
        AsyncStorage.getItem("hasLaunched").then((value) => {
            setIsFirstLaunch(value === null);
        });
    }, []);

    const isPlaying = state.status === "playing";
    const isLevelComplete = state.status === "level_complete";
    const isFailed = state.status === "failed";
    const isGameOver = state.status === "game_over";
    const isIdle = state.status === "idle";

    useEffect(() => {
        if (isFailed || isGameOver) haptics.fail();
        if (isLevelComplete) haptics.success();
    }, [isFailed, isGameOver, isLevelComplete]);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shakeAnimY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isFailed || isGameOver) {
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -2, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(shakeAnimY, { toValue: 2, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: -4, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 0, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 4, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: -2, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 0, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 2, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: -3, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 1, duration: 40, useNativeDriver: true }),
                    Animated.timing(shakeAnimY, { toValue: 0, duration: 40, useNativeDriver: true }),
                ]),
            ]).start();
        }
    }, [isFailed, isGameOver]);

    // Intro animation
    const introOpacity = useRef(new Animated.Value(0)).current;
    const introLine2Opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!showIntro) return;

        introOpacity.setValue(0);
        introLine2Opacity.setValue(0);

        Animated.sequence([
            Animated.timing(introOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.delay(400),
            Animated.timing(introLine2Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.delay(800),
            Animated.parallel([
                Animated.timing(introOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(introLine2Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
        ]).start(() => {
            setShowIntro(false);
            AsyncStorage.setItem("hasLaunched", "true");
            setIsFirstLaunch(false);
            startGame();
        });
    }, [showIntro]);

    const accentColor = isGameOver || isFailed ? COLORS.danger : COLORS.accent;

    const handleResetHighScore = useCallback(() => {
        setHighScore(0);
        AsyncStorage.setItem("highScore", "0");
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {isIdle && <AmbientBackground accentColor={accentColor} />}

            <View style={styles.header}>
                <Pressable
                    onPress={() => setShowDev(true)}
                    style={styles.devButton}
                >
                    <Text style={styles.devText}>DEV</Text>
                </Pressable>
                <Text style={styles.title}>TAPTRAP</Text>
                {isIdle && (
                    <Pressable
                        onPress={() => setShowSettings(true)}
                        style={styles.gearButton}
                    >
                        <Text style={styles.gearText}>{"⚙"}</Text>
                    </Pressable>
                )}
            </View>

            {!isIdle && (
                <ScoreBar
                    level={state.currentLevel}
                    score={state.score}
                    combo={state.combo}
                    highScore={highScore}
                />
            )}

            <Animated.View style={[styles.gameArea, { transform: [{ translateX: shakeAnim }, { translateY: shakeAnimY }] }]}>
                {showIntro ? (
                    <View style={styles.introContainer}>
                        <Animated.Text style={[styles.introLine1, { opacity: introOpacity }]}>
                            Follow the rules.
                        </Animated.Text>
                        <Animated.Text style={[styles.introLine2, { opacity: introLine2Opacity }]}>
                            Or don't.
                        </Animated.Text>
                    </View>
                ) : isIdle ? (
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuTitle}>TAP</Text>
                        <Text style={styles.menuTitleAccent}>TRAP</Text>
                        <Text style={styles.menuSubtitle}>TAP. THINK. SURVIVE.</Text>
                        <Pressable style={styles.startButton} onPress={() => {
                            if (isFirstLaunch) {
                                setShowIntro(true);
                            } else {
                                startGame();
                            }
                        }}>
                            <Text style={styles.startButtonText}>START</Text>
                        </Pressable>
                    </View>
                ) : isGameOver ? (
                    <View style={styles.menuContainer}>
                        <Text style={styles.gameOverTitle}>GAME</Text>
                        <Text style={styles.gameOverTitleAccent}>OVER</Text>
                        <View style={styles.gameOverStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{state.score}</Text>
                                <Text style={styles.statLabel}>SCORE</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{state.currentLevel}</Text>
                                <Text style={styles.statLabel}>LEVEL</Text>
                            </View>
                            {highScore > 0 && (
                                <>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: COLORS.accent }]}>{highScore}</Text>
                                        <Text style={styles.statLabel}>BEST</Text>
                                    </View>
                                </>
                            )}
                        </View>
                        <Pressable style={styles.retryButton} onPress={startGame}>
                            <Text style={styles.retryButtonText}>RETRY</Text>
                        </Pressable>
                        <Pressable style={styles.chaptersButton} onPress={resetGame}>
                            <Text style={styles.chaptersButtonText}>CHAPTERS</Text>
                        </Pressable>
                        <Pressable style={styles.menuButton} onPress={resetGame}>
                            <Text style={styles.menuButtonText}>MENU</Text>
                        </Pressable>
                    </View>
                ) : (
                    level && <ScreenRenderer
                        level={level}
                        state={state}
                        progress={progress}
                        onTap={() => {
                            haptics.tap();
                            handleTap();
                        }}
                        onAction={handleAction}
                        onContinue={continueGame}
                        onRetry={startGame}
                        onMenu={resetGame}
                    />
                )}
            </Animated.View>

            <SettingsScreen
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onResetHighScore={handleResetHighScore}
            />
            <DevScreen
                visible={showDev}
                onClose={() => setShowDev(false)}
                onSelectCategory={(category: Category) => {
                    startTestCategory(category);
                }}
                onSelectScreen={(category: Category, screenType: string) => {
                    startTestScreen(category, screenType);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: "center",
    },
    header: {
        paddingTop: 16,
        paddingBottom: 4,
        width: "100%",
        alignItems: "center",
        position: "relative",
    },
    title: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        letterSpacing: 5,
        color: COLORS.textMuted,
        textTransform: "uppercase",
    },
    devButton: {
        position: "absolute",
        left: 16,
        top: 14,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(255,170,0,0.3)",
        backgroundColor: "rgba(255,170,0,0.05)",
    },
    devText: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        letterSpacing: 2,
        color: COLORS.warning,
    },
    gearButton: {
        position: "absolute",
        right: 20,
        top: 14,
        padding: 4,
    },
    gearText: {
        fontSize: 24,
        color: "rgba(255,255,255,0.2)",
    },
    gameArea: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    menuContainer: {
        alignItems: "center",
        gap: 8,
    },
    menuTitle: {
        fontSize: 36,
        fontFamily: FONTS.light,
        letterSpacing: 6,
        color: COLORS.white,
        marginBottom: -8,
    },
    menuTitleAccent: {
        fontSize: 36,
        fontFamily: FONTS.bold,
        letterSpacing: 6,
        color: COLORS.accent,
    },
    menuSubtitle: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        letterSpacing: 5,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    startButton: {
        paddingVertical: 14,
        paddingHorizontal: 56,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "rgba(0,255,136,0.2)",
        backgroundColor: "rgba(0,255,136,0.03)",
    },
    startButtonText: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        letterSpacing: 4,
        color: COLORS.accent,
    },
    gameOverTitle: {
        fontSize: 36,
        fontFamily: FONTS.light,
        letterSpacing: 6,
        color: COLORS.white,
        marginBottom: -8,
    },
    gameOverTitleAccent: {
        fontSize: 36,
        fontFamily: FONTS.bold,
        letterSpacing: 6,
        color: COLORS.danger,
        marginBottom: 32,
    },
    gameOverStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        marginBottom: 32,
    },
    statItem: {
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    statLabel: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        letterSpacing: 3,
        color: COLORS.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 44,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "rgba(0,255,136,0.2)",
        backgroundColor: "rgba(0,255,136,0.03)",
        marginTop: 8,
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        letterSpacing: 3,
        color: COLORS.accent,
    },
    menuButton: {
        paddingVertical: 10,
        paddingHorizontal: 36,
        marginTop: 8,
    },
    menuButtonText: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        letterSpacing: 3,
        color: COLORS.textSecondary,
    },
    introContainer: {
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    introLine1: {
        fontSize: 22,
        fontFamily: FONTS.light,
        letterSpacing: 2,
        color: COLORS.white,
        textAlign: "center",
    },
    introLine2: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        letterSpacing: 2,
        color: COLORS.accent,
        textAlign: "center",
    },
    chaptersButton: {
        paddingVertical: 10,
        paddingHorizontal: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        marginTop: 4,
    },
    chaptersButtonText: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        letterSpacing: 3,
        color: COLORS.textSecondary,
    },
});