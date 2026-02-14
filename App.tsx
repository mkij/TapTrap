import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import GameScreen from "./src/screens/GameScreen";
import { useSettingsStore } from "./src/store/settingsStore";

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Light": require("./src/assets/fonts/JetBrainsMono-Light.ttf"),
    "JetBrainsMono-Regular": require("./src/assets/fonts/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-Bold": require("./src/assets/fonts/JetBrainsMono-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#08080f" }} />
    );
  }

  return (
    <SafeAreaProvider>
      <GameScreen />
    </SafeAreaProvider>
  );
}