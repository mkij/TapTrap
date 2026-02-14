import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../store/settingsStore";

export function useHaptics() {
    const enabled = useSettingsStore((s) => s.haptics);

    const tap = () => {
        if (Platform.OS === "web" || !enabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const success = () => {
        if (Platform.OS === "web" || !enabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const fail = () => {
        if (Platform.OS === "web" || !enabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    return { tap, success, fail };
}