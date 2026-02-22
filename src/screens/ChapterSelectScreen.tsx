import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    ScrollView,
    Animated,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { FONTS } from "../constants/fonts";
import { COLORS } from "../constants/colors";

interface ChapterData {
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

interface ModeData {
    id: string;
    label: string;
    icon: string;
    unlocked: boolean;
    requirement: string;
    color: string;
    bestScore: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onPlayChapter: (chapterId: number) => void;
    onPlayMode: (modeId: string) => void;
    chapters: ChapterData[];
    modes: ModeData[];
}

// --- Lock icon SVG ---
function LockIcon({ size = 18, color = "rgba(255,255,255,0.2)" }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
            <Rect x={4} y={8} width={10} height={8} rx={2} stroke={color} strokeWidth={1.2} fill="none" />
            <Path d="M6.5 8V5.5C6.5 4.12 7.62 3 9 3C10.38 3 11.5 4.12 11.5 5.5V8" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
    );
}

// --- Check icon SVG ---
function CheckIcon({ color = COLORS.accent }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <Path d="M4 9.5L7.5 13L14 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// --- Arrow icon SVG ---
function ArrowIcon({ color = "rgba(255,255,255,0.25)" }: { color?: string }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path d="M6 3L11 8L6 13" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// --- Progress Bar ---
function ProgressBar({ chapters }: { chapters: ChapterData[] }) {
    const completed = chapters.filter((c) => c.completed).length;
    const total = chapters.length;
    const pct = Math.round((completed / total) * 100);

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.progressValue}>{pct}%</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
        </View>
    );
}

// --- Chapter Card ---
function ChapterCard({
    chapter,
    isNext,
    onPress,
}: {
    chapter: ChapterData;
    isNext: boolean;
    onPress: () => void;
}) {
    const { id, title, screens, unlocked, completed, stars, bestScore } = chapter;

    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isNext) return;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1250, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1250, useNativeDriver: false }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [isNext]);

    const glowOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.08],
    });

    return (
        <Pressable
            onPress={() => unlocked && onPress()}
            style={[
                styles.chapterCard,
                {
                    borderColor: completed
                        ? "rgba(0,255,136,0.15)"
                        : isNext
                            ? "rgba(0,255,136,0.12)"
                            : unlocked
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.03)",
                    backgroundColor: completed
                        ? "rgba(0,255,136,0.03)"
                        : "rgba(255,255,255,0.01)",
                    opacity: unlocked ? 1 : 0.45,
                },
            ]}
        >
            {isNext && (
                <Animated.View
                    style={[styles.chapterGlow, { opacity: glowOpacity }]}
                />
            )}

            {/* Badge */}
            <View
                style={[
                    styles.chapterBadge,
                    {
                        backgroundColor: completed
                            ? "rgba(0,255,136,0.08)"
                            : "rgba(255,255,255,0.03)",
                        borderColor: completed
                            ? "rgba(0,255,136,0.2)"
                            : unlocked
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(255,255,255,0.04)",
                    },
                ]}
            >
                {!unlocked ? (
                    <LockIcon />
                ) : completed ? (
                    <CheckIcon />
                ) : (
                    <Text
                        style={[
                            styles.chapterBadgeText,
                            { color: isNext ? COLORS.accent : "rgba(255,255,255,0.7)" },
                        ]}
                    >
                        {id}
                    </Text>
                )}
            </View>

            {/* Info */}
            <View style={styles.chapterInfo}>
                <View style={styles.chapterTitleRow}>
                    <Text
                        style={[
                            styles.chapterTitle,
                            {
                                color: completed
                                    ? COLORS.accent
                                    : isNext
                                        ? "rgba(255,255,255,0.95)"
                                        : unlocked
                                            ? "rgba(255,255,255,0.85)"
                                            : "rgba(255,255,255,0.3)",
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    {isNext && (
                        <View style={styles.nextBadge}>
                            <Text style={styles.nextBadgeText}>NEXT</Text>
                        </View>
                    )}
                </View>
                <View style={styles.chapterMeta}>
                    <Text style={styles.chapterMetaText}>{screens} rounds</Text>
                    {completed && bestScore > 0 && (
                        <>
                            <Text style={styles.chapterMetaDot}>•</Text>
                            <Text style={styles.chapterMetaScore}>
                                {bestScore.toLocaleString()} pts
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Right */}
            <View style={styles.chapterRight}>
                {completed ? (
                    <View style={styles.starsRow}>
                        {[1, 2, 3].map((s) => (
                            <View
                                key={s}
                                style={[
                                    styles.starDot,
                                    {
                                        backgroundColor:
                                            s <= stars ? COLORS.accent : "rgba(255,255,255,0.06)",
                                    },
                                ]}
                            />
                        ))}
                    </View>
                ) : unlocked ? (
                    <ArrowIcon color={isNext ? COLORS.accent : "rgba(255,255,255,0.25)"} />
                ) : null}
            </View>
        </Pressable>
    );
}

// --- Mode Card ---
function ModeCard({ mode, onPress }: { mode: ModeData; onPress: () => void }) {
    const { label, icon, unlocked, requirement, color, bestScore } = mode;

    return (
        <Pressable
            onPress={() => unlocked && onPress()}
            style={[
                styles.modeCard,
                {
                    borderColor: unlocked ? `${color}20` : "rgba(255,255,255,0.03)",
                    backgroundColor: unlocked ? `${color}04` : "rgba(255,255,255,0.01)",
                    opacity: unlocked ? 1 : 0.4,
                },
            ]}
        >
            <Text style={[styles.modeIcon, { color: unlocked ? color : "rgba(255,255,255,0.3)" }]}>{icon}</Text>
            <Text
                style={[
                    styles.modeLabel,
                    { color: unlocked ? color : "rgba(255,255,255,0.3)" },
                ]}
            >
                {label}
            </Text>
            {!unlocked && (
                <View style={styles.modeRequirement}>
                    <LockIcon size={10} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.modeRequirementText}>{requirement}</Text>
                </View>
            )}
            {unlocked && bestScore > 0 && (
                <Text style={[styles.modeBestScore, { color: `${color}80` }]}>
                    Best: {bestScore.toLocaleString()}
                </Text>
            )}
            {mode.id === "hardcore" && unlocked && (
                <View style={[styles.multiplierBadge, { borderColor: `${color}30`, backgroundColor: `${color}08` }]}>
                    <Text style={[styles.multiplierText, { color }]}>1.5x SCORE</Text>
                </View>
            )}
        </Pressable>
    );
}

// --- Chapter Detail ---
function ChapterDetail({
    chapter,
    onBack,
    onPlay,
}: {
    chapter: ChapterData;
    onBack: () => void;
    onPlay: () => void;
}) {
    const { id, title, screens, completed, stars, bestScore, bestFocus, mechanics } = chapter;

    return (
        <View style={styles.detailContainer}>
            <Pressable onPress={onBack} style={styles.backButton}>
                <Text style={styles.backText}>{"< CHAPTERS"}</Text>
            </Pressable>

            <Text style={styles.detailChapterLabel}>CHAPTER {id}</Text>
            <Text
                style={[
                    styles.detailTitle,
                    { color: completed ? COLORS.accent : "rgba(255,255,255,0.9)" },
                ]}
            >
                {title}
            </Text>
            <View
                style={[
                    styles.titleLine,
                    {
                        backgroundColor: completed
                            ? "rgba(0,255,136,0.3)"
                            : "rgba(255,255,255,0.08)",
                    },
                ]}
            />

            {/* Stars */}
            {completed && (
                <View style={styles.detailStars}>
                    {[1, 2, 3].map((s) => (
                        <View
                            key={s}
                            style={[
                                styles.detailStarDot,
                                {
                                    backgroundColor:
                                        s <= stars ? COLORS.accent : "rgba(255,255,255,0.06)",
                                },
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{screens}</Text>
                    <Text style={styles.statLabel}>ROUNDS</Text>
                </View>
                {completed && (
                    <>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: COLORS.accent }]}>
                                {bestScore.toLocaleString()}
                            </Text>
                            <Text style={styles.statLabel}>BEST SCORE</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text
                                style={[
                                    styles.statValue,
                                    { color: bestFocus >= 70 ? COLORS.accent : COLORS.warning },
                                ]}
                            >
                                {bestFocus}%
                            </Text>
                            <Text style={styles.statLabel}>FOCUS</Text>
                        </View>
                    </>
                )}
            </View>

            {/* Mechanics */}
            <Text style={styles.mechanicsLabel}>MECHANICS</Text>
            <View style={styles.mechanicsTags}>
                {mechanics.map((m) => (
                    <View key={m} style={styles.mechanicTag}>
                        <Text style={styles.mechanicTagText}>{m}</Text>
                    </View>
                ))}
            </View>

            {/* Play */}
            <Pressable onPress={onPlay} style={styles.playButton}>
                <Text style={styles.playButtonText}>
                    {completed ? "REPLAY" : "PLAY"}
                </Text>
            </Pressable>

            {completed && (
                <Text style={styles.replayHint}>
                    Replay to improve your score and focus rating
                </Text>
            )}
        </View>
    );
}

// --- Main Screen ---
export default function ChapterSelectScreen({
    visible,
    onClose,
    onPlayChapter,
    onPlayMode,
    chapters,
    modes,
}: Props) {
    const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);

    const nextChapterId = chapters.find((c) => c.unlocked && !c.completed)?.id ?? null;

    // Reset selection when closing
    useEffect(() => {
        if (!visible) setSelectedChapter(null);
    }, [visible]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {selectedChapter ? (
                        <ChapterDetail
                            chapter={selectedChapter}
                            onBack={() => setSelectedChapter(null)}
                            onPlay={() => {
                                onPlayChapter(selectedChapter.id);
                                setSelectedChapter(null);
                            }}
                        />
                    ) : (
                        <View style={styles.listContainer}>
                            <Pressable onPress={onClose} style={styles.backButton}>
                                <Text style={styles.backText}>{"< MENU"}</Text>
                            </Pressable>

                            <Text style={styles.screenTitle}>CHAPTERS</Text>
                            <View style={styles.titleLine} />

                            <ProgressBar chapters={chapters} />

                            <Text style={styles.sectionLabel}>SEASON 1</Text>

                            {chapters.map((ch) => (
                                <ChapterCard
                                    key={ch.id}
                                    chapter={ch}
                                    isNext={ch.id === nextChapterId}
                                    onPress={() => setSelectedChapter(ch)}
                                />
                            ))}

                            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>
                                SPECIAL MODES
                            </Text>

                            <View style={styles.modesRow}>
                                {modes.map((mode) => (
                                    <ModeCard
                                        key={mode.id}
                                        mode={mode}
                                        onPress={() => onPlayMode(mode.id)}
                                    />
                                ))}
                            </View>

                            <Text style={styles.version}>TAPTRAP v0.1.0</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 56,
    },
    backButton: {
        marginBottom: 28,
        alignSelf: "flex-start",
    },
    backText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
    },
    screenTitle: {
        fontFamily: FONTS.light,
        fontSize: 28,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: 3,
    },
    titleLine: {
        width: 32,
        height: 2,
        backgroundColor: "rgba(0,255,136,0.3)",
        borderRadius: 1,
        marginTop: 10,
        marginBottom: 24,
    },
    sectionLabel: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: "rgba(255,255,255,0.15)",
        letterSpacing: 3,
        marginBottom: 12,
    },
    // Progress
    progressContainer: { marginBottom: 24 },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    progressLabel: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: 3,
    },
    progressValue: {
        fontFamily: FONTS.regular,
        fontSize: 11,
        color: "rgba(0,255,136,0.6)",
        letterSpacing: 1,
    },
    progressTrack: {
        height: 3,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.04)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
        backgroundColor: COLORS.accent,
    },
    // Chapter card
    chapterCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
        overflow: "hidden",
    },
    chapterGlow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.accent,
        borderRadius: 14,
    },
    chapterBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    chapterBadgeText: {
        fontSize: 18,
        fontFamily: FONTS.bold,
    },
    chapterInfo: { flex: 1 },
    chapterTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    chapterTitle: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        letterSpacing: 1,
    },
    nextBadge: {
        backgroundColor: "rgba(0,255,136,0.1)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    nextBadgeText: {
        fontSize: 8,
        fontFamily: FONTS.bold,
        letterSpacing: 2,
        color: COLORS.accent,
    },
    chapterMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 3,
    },
    chapterMetaText: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.2)",
    },
    chapterMetaDot: {
        fontSize: 11,
        color: "rgba(255,255,255,0.06)",
    },
    chapterMetaScore: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: "rgba(0,255,136,0.45)",
    },
    chapterRight: {
        alignItems: "center",
        justifyContent: "center",
    },
    starsRow: {
        flexDirection: "row",
        gap: 3,
    },
    starDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Mode card
    modesRow: {
        flexDirection: "row",
        gap: 10,
    },
    modeCard: {
        flex: 1,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center",
    },
    modeIcon: { fontSize: 24, marginBottom: 8, opacity: 0.9 },
    modeLabel: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        letterSpacing: 3,
        marginBottom: 4,
    },
    modeRequirement: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    modeRequirementText: {
        fontSize: 9,
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.15)",
    },
    modeBestScore: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        letterSpacing: 1,
        marginTop: 6,
    },
    multiplierBadge: {
        marginTop: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    multiplierText: {
        fontSize: 8,
        fontFamily: FONTS.bold,
        letterSpacing: 2,
    },
    // Detail
    detailContainer: {
        paddingHorizontal: 24,
        paddingTop: 56,
    },
    detailChapterLabel: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        letterSpacing: 4,
        color: "rgba(255,255,255,0.2)",
        marginBottom: 6,
    },
    detailTitle: {
        fontSize: 28,
        fontFamily: FONTS.light,
        letterSpacing: 3,
    },
    detailStars: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 24,
    },
    detailStarDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statsRow: {
        flexDirection: "row",
        gap: 1,
        marginBottom: 24,
        borderRadius: 12,
        overflow: "hidden",
    },
    statBox: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: "rgba(255,255,255,0.02)",
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: "rgba(255,255,255,0.85)",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 8,
        fontFamily: FONTS.regular,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.2)",
    },
    mechanicsLabel: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        letterSpacing: 3,
        color: "rgba(255,255,255,0.2)",
        marginBottom: 10,
    },
    mechanicsTags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 28,
    },
    mechanicTag: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: "rgba(255,255,255,0.02)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    mechanicTagText: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.35)",
    },
    playButton: {
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "rgba(0,255,136,0.25)",
        backgroundColor: "rgba(0,255,136,0.05)",
        alignItems: "center",
    },
    playButtonText: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        letterSpacing: 4,
        color: COLORS.accent,
    },
    replayHint: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.12)",
        textAlign: "center",
        marginTop: 10,
    },
    version: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.06)",
        letterSpacing: 2,
        textAlign: "center",
        marginTop: 28,
    },
});