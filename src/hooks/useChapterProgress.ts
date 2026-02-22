import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chapterProgress";

export interface ChapterProgress {
    id: number;
    title: string;
    screens: number;
    unlocked: boolean;
    completed: boolean;
    stars: number;
    bestScore: number;
    bestFocus: number;
    mechanics: string[];
}

const DEFAULT_CHAPTERS: ChapterProgress[] = [
    { id: 1, title: "AWAKENING", screens: 8, unlocked: true, completed: false, stars: 0, bestScore: 0, bestFocus: 0, mechanics: ["Tap", "Don't tap", "Double tap", "Hold"] },
    { id: 2, title: "DECEPTION", screens: 10, unlocked: false, completed: false, stars: 0, bestScore: 0, bestFocus: 0, mechanics: ["Opposite", "Fake buttons", "Misleading"] },
    { id: 3, title: "OVERLOAD", screens: 12, unlocked: false, completed: false, stars: 0, bestScore: 0, bestFocus: 0, mechanics: ["Memory", "Math", "Conflict"] },
    { id: 4, title: "CHAOS", screens: 15, unlocked: false, completed: false, stars: 0, bestScore: 0, bestFocus: 0, mechanics: ["Mashups", "Sensors", "Everything"] },
];

function calculateStars(score: number, screens: number): number {
    const avgPerScreen = score / screens;
    if (avgPerScreen >= 200) return 3;
    if (avgPerScreen >= 120) return 2;
    return 1;
}

export default function useChapterProgress() {
    const [chapters, setChapters] = useState<ChapterProgress[]>(DEFAULT_CHAPTERS);
    const [loaded, setLoaded] = useState(false);

    // Load from AsyncStorage
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((value) => {
            if (value) {
                try {
                    const saved = JSON.parse(value) as ChapterProgress[];
                    setChapters(saved);
                } catch {}
            }
            setLoaded(true);
        });
    }, []);

    // Save helper
    const save = useCallback((updated: ChapterProgress[]) => {
        setChapters(updated);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    // Mark chapter complete + unlock next
    const markChapterComplete = useCallback((chapterId: number, score: number, focus: number) => {
        setChapters((prev) => {
            const updated = prev.map((ch) => {
                if (ch.id === chapterId) {
                    const stars = calculateStars(score, ch.screens);
                    return {
                        ...ch,
                        completed: true,
                        stars: Math.max(ch.stars, stars),
                        bestScore: Math.max(ch.bestScore, score),
                        bestFocus: Math.max(ch.bestFocus, focus),
                    };
                }
                // Unlock next chapter
                if (ch.id === chapterId + 1) {
                    return { ...ch, unlocked: true };
                }
                return ch;
            });
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Next chapter to play
    const nextChapterId = chapters.find((c) => c.unlocked && !c.completed)?.id
        ?? (chapters.every((c) => c.completed) ? 1 : 1);

    // Modes unlock status
    const modes = [
        {
            id: "endless",
            label: "ENDLESS",
            icon: "♾",
            unlocked: chapters.find((c) => c.id === 3)?.completed ?? false,
            requirement: "Complete Chapter 3",
            color: "#00ff88",
        },
        {
            id: "hardcore",
            label: "HARDCORE",
            icon: "💀",
            unlocked: chapters.find((c) => c.id === 4)?.completed ?? false,
            requirement: "Complete Chapter 4",
            color: "#ff3355",
        },
    ];

    return {
        chapters,
        modes,
        loaded,
        nextChapterId,
        markChapterComplete,
    };
}