import React, { memo } from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";

interface InstructionProps {
  text: string;
  failed: boolean;
  success: boolean;
}

function Instruction({ text, failed, success }: InstructionProps) {
  const color = failed
    ? COLORS.danger
    : success
      ? COLORS.accent
      : COLORS.white;

  const displayText = failed
    ? "FAILED"
    : success
      ? "NICE!"
      : text;

  return (
    <Text
      style={[
        styles.text,
        { color },
        (failed || success) && styles.bold,
      ]}
    >
      {displayText}
    </Text>
  );
}

const styles = StyleSheet.create({
   text: {
    fontSize: 22,
    fontFamily: FONTS.regular,
    letterSpacing: 2,
    textAlign: "center",
    minHeight: 30,
  },
  bold: {
    fontFamily: FONTS.bold,
  },
});

export default memo(Instruction);