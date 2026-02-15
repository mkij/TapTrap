import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { Category } from "../engine/types";
import { getAvailableCategories } from "../engine/devTools";

interface DevScreenProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  basic: "#DFE6E9",
  opposite: "#FFEAA7",
  memory: "#81ECEC",
  perception: "#FAB1A0",
  time: "#A29BFE",
  math: "#55EFC4",
  conflict: "#FD79A8",
  device: "#FDCB6E",
  meta: "#E17055",
  habit: "#00CEC9",
  surprise: "#636E72",
  cumulative: "#B2BEC3",
};

function DevScreen({ visible, onClose, onSelectCategory }: DevScreenProps) {
  const categories = getAvailableCategories();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>DEV TOOLS</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>TEST BY CATEGORY</Text>

          <ScrollView contentContainerStyle={styles.grid}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.tile,
                  { borderColor: CATEGORY_COLORS[cat] ?? COLORS.textMuted },
                ]}
                onPress={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.tileDot,
                    { backgroundColor: CATEGORY_COLORS[cat] ?? COLORS.textMuted },
                  ]}
                />
                <Text style={styles.tileText}>{cat.toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 4,
    color: COLORS.warning,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    letterSpacing: 3,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.white,
  },
});

export default memo(DevScreen);