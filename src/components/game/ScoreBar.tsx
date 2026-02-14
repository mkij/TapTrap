import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

interface ScoreBarProps {
  level: number;
  score: number;
  combo: number;
  highScore: number;
}

export default function ScoreBar({ level, score, combo, highScore }: ScoreBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        LVL <Text style={styles.value}>{level}</Text>
      </Text>
      <Text style={styles.label}>
        SCORE <Text style={styles.valueAccent}>{score}</Text>
      </Text>
      {combo > 1 && (
        <Text style={styles.label}>
          COMBO <Text style={styles.valueAccent}>x{combo}</Text>
        </Text>
      )}
      {highScore > 0 && (
        <Text style={styles.label}>
          BEST <Text style={styles.value}>{highScore}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 24,
    paddingVertical: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 2,
    color: COLORS.textSecondary,
  },
  value: {
    color: COLORS.white,
  },
  valueAccent: {
    color: COLORS.accent,
  },
});