import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
    music: boolean;
    sounds: boolean;
    haptics: boolean;
    setMusic: (v: boolean) => void;
    setSounds: (v: boolean) => void;
    setHaptics: (v: boolean) => void;
    loadSettings: () => Promise<void>;
}

const STORAGE_KEY = "settings";

export const useSettingsStore = create<SettingsState>((set, get) => ({
    music: true,
    sounds: true,
    haptics: true,

    setMusic: (v) => {
        set({ music: v });
        persist(get());
    },
    setSounds: (v) => {
        set({ sounds: v });
        persist(get());
    },
    setHaptics: (v) => {
        set({ haptics: v });
        persist(get());
    },

    loadSettings: async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            set({
                music: parsed.music ?? true,
                sounds: parsed.sounds ?? true,
                haptics: parsed.haptics ?? true,
            });
        }
    },
}));

function persist(state: SettingsState) {
    AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            music: state.music,
            sounds: state.sounds,
            haptics: state.haptics,
        })
    );
}