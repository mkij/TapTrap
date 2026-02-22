import { useState, useRef, useCallback, useEffect } from "react";
import { GameState, Level, INITIAL_MEMORY, ActionType } from "../engine/types";
import { validateAction } from "../engine/rules";
import { generateLevel } from "../engine/levels";
import { getStageLevelDef, buildLevelFromStage } from "../engine/stages";
import { generateTestLevel, generateTestLevelByScreen } from "../engine/devTools";
import { Category } from "../engine/types";
import { calculateScore, calculateCombo } from "../engine/scoring";
import { TIMER_TICK_MS, LEVEL_TRANSITION_MS } from "../constants/timing";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INITIAL_STATE: GameState = {
    status: "idle",
    currentLevel: 0,
    score: 0,
    lives: 3,
    tapCount: 0,
    timeRemaining: 0,
    combo: 0,
    memory: { ...INITIAL_MEMORY },
    rememberedNumber: null,
    rememberedIcon: null,
};

export default function useGameLoop() {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const [level, setLevel] = useState<Level | null>(null);
    const [highScore, setHighScore] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recentRulesRef = useRef<string[]>([]);
    const recentCategoriesRef = useRef<string[]>([]);
    const recentResultsRef = useRef<boolean[]>([]);
    const gameModeRef = useRef<"chapter" | "endless" | "hardcore">("chapter");
    const chapterRef = useRef<{ id: number; totalScreens: number; completed: number } | null>(null);

    const devModeRef = useRef<{
        active: boolean;
        category: Category | null;
        screenType: string | null;
    }>({ active: false, category: null, screenType: null });

    // Load high score on mount
    useEffect(() => {
        AsyncStorage.getItem("highScore").then((value) => {
            if (value) setHighScore(parseInt(value, 10));
        });
    }, []);

    // Clear timer helper
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Start a specific level
    const startLevel = useCallback(
        (levelNumber: number, currentState: GameState) => {
            let newLevel;
            const dev = devModeRef.current;

            if (dev.active && dev.category && dev.screenType) {
                // Dev mode with screen type: pick from that screen type
                newLevel = generateTestLevelByScreen(dev.category, dev.screenType);
            } else if (dev.active && dev.category) {
                // Dev mode with category only: random from category
                newLevel = generateTestLevel(dev.category);
            } else {
                // Normal game: story mode or endless
                const stageDef = getStageLevelDef(levelNumber);
                newLevel = stageDef
                    ? buildLevelFromStage(
                        stageDef,
                        levelNumber,
                        currentState.memory.icon,
                        {
                            combo: currentState.combo,
                            recentErrors: recentResultsRef.current.filter((r) => !r).length,
                            totalLevels: levelNumber,
                            chapterId: chapterRef.current?.id ?? null,
                            gameMode: gameModeRef.current,
                        }
                    )
                    : generateLevel(levelNumber, {
                        rememberedIcon: currentState.memory.icon,
                        recentRules: recentRulesRef.current,
                        recentCategories: recentCategoriesRef.current,
                        performance: {
                            combo: currentState.combo,
                            recentErrors: recentResultsRef.current.filter((r) => !r).length,
                            totalLevels: levelNumber,
                            chapterId: chapterRef.current?.id ?? null,
                            gameMode: gameModeRef.current,
                        },
                    });
            }

            // Track history for endless mode anti-repeat
            recentRulesRef.current = [...recentRulesRef.current, newLevel.rule].slice(-3);
            recentCategoriesRef.current = [
                ...recentCategoriesRef.current,
                newLevel.category ?? "basic",
            ].slice(-3);

            // Build updated memory from level params
            const updatedMemory = { ...currentState.memory };

            if (newLevel.rule === "remember_number" && newLevel.params.rememberValue) {
                updatedMemory.number = newLevel.params.rememberValue as number;
                updatedMemory.numberHistory = [
                    ...updatedMemory.numberHistory,
                    newLevel.params.rememberValue as number,
                ].slice(-5);
            }

            if (newLevel.rule === "remember_icon" && newLevel.params.rememberIcon) {
                updatedMemory.icon = newLevel.params.rememberIcon as string;
                updatedMemory.iconHistory = [
                    ...updatedMemory.iconHistory,
                    newLevel.params.rememberIcon as string,
                ].slice(-5);
            }

            // Track color from levels that use colors (avoid_previous_color)
            if (newLevel.params.levelColor) {
                updatedMemory.previousColor = newLevel.params.levelColor as string;
                updatedMemory.colorHistory = [
                    ...updatedMemory.colorHistory,
                    newLevel.params.levelColor as string,
                ].slice(-5);
            }

            setLevel(newLevel);
            setState((prev) => ({
                ...prev,
                status: "playing",
                currentLevel: levelNumber,
                tapCount: 0,
                timeRemaining: newLevel.timeLimit,
                memory: updatedMemory,
                // Keep deprecated fields in sync
                rememberedNumber: updatedMemory.number,
                rememberedIcon: updatedMemory.icon,
            }));

            // Start countdown
            clearTimer();
            timerRef.current = setInterval(() => {
                setState((prev) => {
                    const newTime = prev.timeRemaining - TIMER_TICK_MS;
                    if (newTime <= 0) {
                        clearTimer();
                        return { ...prev, timeRemaining: 0 };
                    }
                    return { ...prev, timeRemaining: newTime };
                });
            }, TIMER_TICK_MS);
        },
        [clearTimer]
    );

    // Handle timer reaching zero
    useEffect(() => {
        if (state.status !== "playing" || !level) return;
        if (state.timeRemaining > 0) return;

        clearTimer();
        const result = validateAction(level, state, "timer_expired");

        if (result.passed) {
            handleLevelComplete(result.memoryUpdate);
        } else {
            handleFail();
        }
    }, [state.timeRemaining]);

    // Level complete
    const handleLevelComplete = useCallback(
        (memoryUpdate?: Partial<typeof INITIAL_MEMORY>) => {
            clearTimer();
            const newCombo = calculateCombo(state.combo, true);
            const points = level
                ? calculateScore(state.combo, state.timeRemaining, level.timeLimit)
                : 0;

            // Merge memory: current + validator update + track previous action/rule
            const updatedMemory = {
                ...state.memory,
                ...memoryUpdate,
                previousRule: level?.rule ?? null,
                previousCorrectAction: state.tapCount > 0 ? "tap" : "timer_expired",
                totalTaps: state.memory.totalTaps + state.tapCount,
                correctTaps: state.memory.correctTaps + state.tapCount,
            };

            const updatedState: GameState = {
                ...state,
                status: "level_complete",
                score: state.score + points,
                combo: newCombo,
                memory: updatedMemory,
                rememberedNumber: updatedMemory.number,
                rememberedIcon: updatedMemory.icon,
            };

            recentResultsRef.current = [...recentResultsRef.current, true].slice(-5);

            // Check chapter completion
            console.log("CHAPTER REF:", JSON.stringify(chapterRef.current));
            if (chapterRef.current) {
                chapterRef.current.completed += 1;
                console.log("CHAPTER:", chapterRef.current.completed, "/", chapterRef.current.totalScreens);
                if (chapterRef.current.completed >= chapterRef.current.totalScreens) {
                    setState({ ...updatedState, status: "chapter_complete" });
                    return;
                }
            }

            setState(updatedState);

            setTimeout(() => {
                startLevel(updatedState.currentLevel + 1, updatedState);
            }, LEVEL_TRANSITION_MS);
        },
        [clearTimer, state, level, startLevel]
    );

    // Fail
    const handleFail = useCallback(() => {
        clearTimer();
        const newCombo = calculateCombo(state.combo, false);

        recentResultsRef.current = [...recentResultsRef.current, false].slice(-5);

        setState((prev) => {
            const newLives = prev.lives - 1;
            const newHighScore = Math.max(highScore, prev.score);
            if (newHighScore > highScore) {
                setHighScore(newHighScore);
                AsyncStorage.setItem("highScore", newHighScore.toString());
            }

            const updatedMemory = {
                ...prev.memory,
                errorCount: prev.memory.errorCount + 1,
            };

            if (newLives <= 0) {
                return {
                    ...prev,
                    status: "game_over" as const,
                    combo: newCombo,
                    lives: 0,
                    memory: updatedMemory,
                    rememberedNumber: updatedMemory.number,
                    rememberedIcon: updatedMemory.icon,
                };
            }

            return {
                ...prev,
                status: "failed" as const,
                combo: newCombo,
                lives: newLives,
                memory: updatedMemory,
                rememberedNumber: updatedMemory.number,
                rememberedIcon: updatedMemory.icon,
            };
        });
    }, [clearTimer, state.combo, highScore]);

    // Handle any action (tap is most common, extensible for shake/hold/etc)
    const handleAction = useCallback(
        (action: ActionType) => {
            if (state.status !== "playing" || !level) return;

            const newTapCount = action === "tap" ? state.tapCount + 1 : state.tapCount;
            const stateForValidation = { ...state, tapCount: state.tapCount };
            const result = validateAction(level, stateForValidation, action);

            setState((prev) => ({
                ...prev,
                tapCount: newTapCount,
                memory: {
                    ...prev.memory,
                    previousAction: action,
                },
            }));

            if (result.passed) {
                handleLevelComplete(result.memoryUpdate);
            } else if (result.reason) {
                handleFail();
            }
            // No reason = keep going (tap_n_times mid-count)
        },
        [state, level, handleLevelComplete, handleFail]
    );

    // Backward-compatible tap handler
    const handleTap = useCallback(() => {
        handleAction("tap");
    }, [handleAction]);

    // Start new game
    const startGame = useCallback(() => {
        recentRulesRef.current = [];
        recentCategoriesRef.current = [];
        devModeRef.current = { active: false, category: null, screenType: null };
        chapterRef.current = null;
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            memory: { ...INITIAL_MEMORY },
        };
        setState(freshState);
        startLevel(1, freshState);
    }, [startLevel]);

    // Chapter screen counts
    const CHAPTER_SCREENS: Record<number, number> = { 1: 8, 2: 10, 3: 12, 4: 15 };

    // Start a chapter
    const startChapter = useCallback((chapterId: number) => {
        console.log("START CHAPTER CALLED:", chapterId);
        recentRulesRef.current = [];
        recentResultsRef.current = [];
        recentCategoriesRef.current = [];
        devModeRef.current = { active: false, category: null, screenType: null };
        gameModeRef.current = "chapter";
        chapterRef.current = {
            id: chapterId,
            totalScreens: CHAPTER_SCREENS[chapterId] ?? 10,
            completed: 0,
        };
        console.log("CHAPTER REF SET:", JSON.stringify(chapterRef.current));
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            memory: { ...INITIAL_MEMORY },
        };
        setState(freshState);
        startLevel(1, freshState);
    }, [startLevel]);

    // Start endless mode (infinite run, no chapter tracking)
    const startEndless = useCallback(() => {
        recentRulesRef.current = [];
        recentResultsRef.current = [];
        recentCategoriesRef.current = [];
        devModeRef.current = { active: false, category: null, screenType: null };
        gameModeRef.current = "endless";
        chapterRef.current = null;
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            lives: 3,
            memory: { ...INITIAL_MEMORY },
        };
        setState(freshState);
        startLevel(1, freshState);
    }, [startLevel]);

    // Start hardcore mode (1 life, shorter timers)
    const startHardcore = useCallback(() => {
        recentRulesRef.current = [];
        recentResultsRef.current = [];
        recentCategoriesRef.current = [];
        devModeRef.current = { active: false, category: null, screenType: null };
        gameModeRef.current = "hardcore";
        chapterRef.current = null;
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            lives: 1,
            memory: { ...INITIAL_MEMORY },
        };
        setState(freshState);
        startLevel(1, freshState);
    }, [startLevel]);

    // Continue after fail (keep lives, score, level)
    const continueGame = useCallback(() => {
        startLevel(state.currentLevel, state);
    }, [state, startLevel]);

    // Reset to menu
    const resetGame = useCallback(() => {
        console.log("RESET GAME CALLED");
        clearTimer();
        devModeRef.current = { active: false, category: null, screenType: null };
        chapterRef.current = null;
        setState(INITIAL_STATE);
        setLevel(null);
    }, [clearTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    // Dev: start a level from specific category + screen type
    const startTestScreen = useCallback((category: Category, screenType: string) => {
        clearTimer();
        recentRulesRef.current = [];
        recentCategoriesRef.current = [];

        devModeRef.current = { active: true, category, screenType };

        const testLevel = generateTestLevelByScreen(category, screenType);

        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            currentLevel: 999,
            memory: { ...INITIAL_MEMORY },
            rememberedNumber: null,
            rememberedIcon: null,
        };

        setLevel(testLevel);
        setState({
            ...freshState,
            timeRemaining: testLevel.timeLimit,
        });

        timerRef.current = setInterval(() => {
            setState((prev) => {
                const newTime = prev.timeRemaining - TIMER_TICK_MS;
                if (newTime <= 0) {
                    clearTimer();
                    return { ...prev, timeRemaining: 0 };
                }
                return { ...prev, timeRemaining: newTime };
            });
        }, TIMER_TICK_MS);
    }, [clearTimer]);

    // Dev: start a random level from specific category
    const startTestCategory = useCallback((category: Category) => {
        clearTimer();
        recentRulesRef.current = [];
        recentCategoriesRef.current = [];

        devModeRef.current = { active: true, category, screenType: null };

        const testLevel = generateTestLevel(category);

        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
            currentLevel: 999,
            memory: { ...INITIAL_MEMORY },
            rememberedNumber: null,
            rememberedIcon: null,
        };

        setLevel(testLevel);
        setState({
            ...freshState,
            timeRemaining: testLevel.timeLimit,
        });

        timerRef.current = setInterval(() => {
            setState((prev) => {
                const newTime = prev.timeRemaining - TIMER_TICK_MS;
                if (newTime <= 0) {
                    clearTimer();
                    return { ...prev, timeRemaining: 0 };
                }
                return { ...prev, timeRemaining: newTime };
            });
        }, TIMER_TICK_MS);
    }, [clearTimer]);

    const progress = level ? state.timeRemaining / level.timeLimit : 1;

    return {
        state,
        level,
        progress,
        highScore,
        setHighScore,
        handleTap,
        handleAction,
        startGame,
        startChapter,
        startEndless,
        startHardcore,
        continueGame,
        resetGame,
        startTestCategory,
        startTestScreen,
        chapterInfo: chapterRef.current,
    };
}