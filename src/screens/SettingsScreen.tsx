import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettingsStore } from "../store/settingsStore";
import { FONTS } from "../constants/fonts";
import { COLORS } from "../constants/colors";

interface Props {
    visible: boolean;
    onClose: () => void;
    onResetHighScore: () => void;
}

// --- Toggle component ---
function Toggle({
    value,
    onToggle,
}: {
    value: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <Pressable
            onPress={() => onToggle(!value)}
            style={[
                styles.toggle,
                {
                    backgroundColor: value
                        ? "rgba(0,255,136,0.15)"
                        : "rgba(255,255,255,0.06)",
                    borderColor: value
                        ? "rgba(0,255,136,0.35)"
                        : "rgba(255,255,255,0.1)",
                },
            ]}
        >
            <View
                style={[
                    styles.toggleDot,
                    {
                        left: value ? 25 : 3,
                        backgroundColor: value
                            ? COLORS.accent
                            : "rgba(255,255,255,0.25)",
                    },
                ]}
            />
        </Pressable>
    );
}

// --- Setting row ---
function SettingRow({
    label,
    description,
    value,
    onToggle,
}: {
    label: string;
    description: string;
    value: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <View style={styles.row}>
            <View>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowDesc}>{description}</Text>
            </View>
            <Toggle value={value} onToggle={onToggle} />
        </View>
    );
}

export default function SettingsScreen({
    visible,
    onClose,
    onResetHighScore,
}: Props) {
    const { music, sounds, haptics, setMusic, setSounds, setHaptics } =
        useSettingsStore();
    const [showConfirm, setShowConfirm] = useState(false);
    const [resetDone, setResetDone] = useState(false);

    const handleReset = useCallback(() => {
        onResetHighScore();
        setShowConfirm(false);
        setResetDone(true);
        setTimeout(() => setResetDone(false), 2000);
    }, [onResetHighScore]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <Pressable onPress={onClose} style={styles.backButton}>
                    <Text style={styles.backText}>{"< BACK"}</Text>
                </Pressable>

                <Text style={styles.title}>SETTINGS</Text>
                <View style={styles.titleLine} />

                {/* Section: Audio */}
                <Text style={styles.sectionLabel}>AUDIO & FEEDBACK</Text>

                <SettingRow
                    label="Music"
                    description="Background music"
                    value={music}
                    onToggle={setMusic}
                />
                <SettingRow
                    label="Sounds"
                    description="Tap, success & fail effects"
                    value={sounds}
                    onToggle={setSounds}
                />
                <SettingRow
                    label="Haptics"
                    description="Vibration feedback"
                    value={haptics}
                    onToggle={setHaptics}
                />

                {/* Section: Data */}
                <Text style={[styles.sectionLabel, { marginTop: 32 }]}>DATA</Text>

                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowLabel}>Reset High Score</Text>
                        <Text style={styles.rowDesc}>This cannot be undone</Text>
                    </View>
                    {resetDone ? (
                        <Text style={styles.doneText}>DONE</Text>
                    ) : (
                        <Pressable
                            onPress={() => setShowConfirm(true)}
                            style={styles.resetButton}
                        >
                            <Text style={styles.resetButtonText}>RESET</Text>
                        </Pressable>
                    )}
                </View>

                {/* Version */}
                <Text style={styles.version}>TAPTRAP v0.1.0</Text>

                {/* Confirm modal */}
                <Modal
                    visible={showConfirm}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowConfirm(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>
                                Reset High Score?
                            </Text>
                            <Text style={styles.modalDesc}>
                                Your best score will be permanently erased.
                            </Text>
                            <View style={styles.modalButtons}>
                                <Pressable
                                    onPress={() => setShowConfirm(false)}
                                    style={styles.modalCancel}
                                >
                                    <Text style={styles.modalCancelText}>
                                        CANCEL
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleReset}
                                    style={styles.modalConfirm}
                                >
                                    <Text style={styles.modalConfirmText}>
                                        RESET
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 28,
        paddingTop: 56,
    },
    backButton: {
        marginBottom: 32,
        alignSelf: "flex-start",
    },
    backText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
    },
    title: {
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
        marginBottom: 36,
    },
    sectionLabel: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: 3,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.04)",
    },
    rowLabel: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        letterSpacing: 0.5,
    },
    rowDesc: {
        fontFamily: FONTS.regular,
        fontSize: 11,
        color: "rgba(255,255,255,0.25)",
        marginTop: 2,
    },
    toggle: {
        width: 48,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        position: "relative",
    },
    toggleDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        position: "absolute",
        top: 2.5,
    },
    resetButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(255,51,85,0.25)",
        backgroundColor: "rgba(255,51,85,0.06)",
    },
    resetButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        color: COLORS.danger,
        letterSpacing: 1,
    },
    doneText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.accent,
        letterSpacing: 1,
    },
    version: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: "rgba(255,255,255,0.1)",
        letterSpacing: 2,
        textAlign: "center",
        position: "absolute",
        bottom: 28,
        alignSelf: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(8,8,15,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        backgroundColor: "#12121f",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 28,
        width: 280,
        alignItems: "center",
    },
    modalTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: "#fff",
        letterSpacing: 1,
        marginBottom: 8,
    },
    modalDesc: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.35)",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 10,
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.04)",
        alignItems: "center",
    },
    modalCancelText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        letterSpacing: 1,
    },
    modalConfirm: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,51,85,0.3)",
        backgroundColor: "rgba(255,51,85,0.12)",
        alignItems: "center",
    },
    modalConfirmText: {
        fontFamily: FONTS.bold,
        fontSize: 13,
        color: COLORS.danger,
        letterSpacing: 1,
    },
});