/*

import { useRef, useEffect } from "react";
import { Audio } from "expo-av";

export function useSound() {
  const sounds = useRef<Record<string, Audio.Sound>>({});

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      Object.values(sounds.current).forEach((sound) => {
        sound.unloadAsync();
      });
    };
  }, []);

  const play = async (name: "tap" | "success" | "fail") => {
    try {
      // Reuse loaded sound or create new
      if (sounds.current[name]) {
        await sounds.current[name].replayAsync();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        getSoundSource(name),
        { shouldPlay: true, volume: name === "tap" ? 0.3 : 0.5 }
      );
      sounds.current[name] = sound;
    } catch {
      // Silently fail - sound is not critical
    }
  };

  return { play };
}

function getSoundSource(name: string) {
  // We'll generate simple sounds - for now use empty require
  // Replace these with actual sound files later
  switch (name) {
    case "tap":
      return require("../../assets/sounds/tap.mp3");
    case "success":
      return require("../../assets/sounds/success.mp3");
    case "fail":
      return require("../../assets/sounds/fail.mp3");
    default:
      return require("../../assets/sounds/tap.mp3");
  }
}

*/