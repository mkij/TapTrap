import { useState, useRef, useCallback, useEffect } from "react";
import { GameState, Level } from "../engine/types";
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
    rememberedNumber: null,
    rememberedIcon: null,
};

export default function useGameLoop() {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const [level, setLevel] = useState<Level | null>(null);
    const [highScore, setHighScore] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            const newLevel = generateLevel(levelNumber);

            // Handle memory: store remembered values
            let rememberedNumber = currentState.rememberedNumber;
            let rememberedIcon = currentState.rememberedIcon;

            if (newLevel.rule === "remember_number" && newLevel.params.rememberValue) {
                rememberedNumber = newLevel.params.rememberValue;
            }

            if (newLevel.rule === "remember_icon" && newLevel.params.rememberIcon) {
                rememberedIcon = newLevel.params.rememberIcon;
            }

            // For recall_icon, resolve the actual target
            if (newLevel.rule === "recall_icon") {
                if (newLevel.params.targetIcon === "REMEMBERED") {
                    newLevel.params.targetIcon = rememberedIcon || "star";
                }
                newLevel.instruction = `Tap if: ${newLevel.params.targetIcon}`;
            }

            setLevel(newLevel);
            setState((prev) => ({
                ...prev,
                status: "playing",
                currentLevel: levelNumber,
                tapCount: 0,
                timeRemaining: newLevel.timeLimit,
                rememberedNumber,
                rememberedIcon,
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
            handleLevelComplete();
        } else {
            handleFail();
        }
    }, [state.timeRemaining]);

    // Level complete
    const handleLevelComplete = useCallback(() => {
        clearTimer();
        const newCombo = calculateCombo(state.combo, true);
        const points = level
            ? calculateScore(state.combo, state.timeRemaining, level.timeLimit)
            : 0;

        const updatedState: GameState = {
            ...state,
            status: "level_complete",
            score: state.score + points,
            combo: newCombo,
        };

        setState(updatedState);

        setTimeout(() => {
            startLevel(updatedState.currentLevel + 1, updatedState);
        }, LEVEL_TRANSITION_MS);
    }, [clearTimer, state, level, startLevel]);

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

            if (newLives <= 0) {
                return {
                    ...prev,
                    status: "game_over",
                    combo: newCombo,
                    lives: 0,
                };
            }

            return {
                ...prev,
                status: "failed",
                combo: newCombo,
                lives: newLives,
            };
        });
    }, [clearTimer, state.combo, highScore]);

    // Handle tap
    const handleTap = useCallback(() => {
        if (state.status !== "playing" || !level) return;

        const newTapCount = state.tapCount + 1;
        const stateForValidation = { ...state, tapCount: state.tapCount };
        const result = validateAction(level, stateForValidation, "tap");

        setState((prev) => ({ ...prev, tapCount: newTapCount }));

        if (result.passed) {
            handleLevelComplete();
        } else if (result.reason) {
            handleFail();
        }
        // No reason = keep going (tap_n_times mid-count)
    }, [state, level, handleLevelComplete, handleFail]);

    // Start new game
    const startGame = useCallback(() => {
        const freshState: GameState = {
            ...INITIAL_STATE,
            status: "playing",
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
        startGame,
        continueGame,
        resetGame,
    };
}