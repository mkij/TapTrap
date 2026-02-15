import { useState, useRef, useCallback, useEffect } from "react";
import { GameState, Level, INITIAL_MEMORY, ActionType } from "../engine/types";
import { validateAction } from "../engine/rules";
import { generateLevel } from "../engine/levels";
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
            const newLevel = generateLevel(levelNumber, {
                rememberedIcon: currentState.memory.icon,
                recentRules: recentRulesRef.current,
                recentCategories: recentCategoriesRef.current,
            });

            // Track history (keep last 3)
            recentRulesRef.current = [...recentRulesRef.current, newLevel.rule].slice(-3);
            recentCategoriesRef.current = [
                ...recentCategoriesRef.current,
                newLevel.category ?? "basic",
            ].slice(-3);

            // Build updated memory from level params
            const updatedMemory = { ...currentState.memory };

            if (newLevel.rule === "remember_number" && newLevel.params.rememberValue) {
                updatedMemory.number = newLevel.params.rememberValue as number;
            }

            if (newLevel.rule === "remember_icon" && newLevel.params.rememberIcon) {
                updatedMemory.icon = newLevel.params.rememberIcon as string;
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
            const result = validateAction(level, stateForValidation, action as "tap" | "timer_expired");

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
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
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
        clearTimer();
        setState(INITIAL_STATE);
        setLevel(null);
    }, [clearTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimer();
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
        continueGame,
        resetGame,
    };
}