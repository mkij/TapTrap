import React, { useState, memo } from "react";
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
import { getAvailableCategories, getScreenTypesForCategory } from "../engine/devTools";

interface DevScreenProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  onSelectScreen: (category: Category, screenType: string) => void;
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

function DevScreen({ visible, onClose, onSelectCategory, onSelectScreen }: DevScreenProps) {
  const categories = getAvailableCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const screenTypes = selectedCategory
    ? getScreenTypesForCategory(selectedCategory)
    : [];

  const handleClose = () => {
    setSelectedCategory(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleCategoryPress = (cat: Category) => {
    const screens = getScreenTypesForCategory(cat);
    if (screens.length <= 1) {
      // Only one screen type — skip drill-down, start directly
      onSelectCategory(cat);
      handleClose();
    } else {
      setSelectedCategory(cat);
    }
  };

  const handleScreenPress = (screenType: string) => {
    if (!selectedCategory) return;
    onSelectScreen(selectedCategory, screenType);
    handleClose();
  };

  const catColor = selectedCategory
    ? CATEGORY_COLORS[selectedCategory] ?? COLORS.textMuted
    : COLORS.warning;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            {selectedCategory ? (
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={[styles.backText, { color: catColor }]}>{"< BACK"}</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.title, { color: selectedCategory ? catColor : COLORS.warning }]}>
              {selectedCategory ? selectedCategory.toUpperCase() : "DEV TOOLS"}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          {!selectedCategory ? (
            <>
              <Text style={styles.sectionLabel}>TEST BY CATEGORY</Text>
              <ScrollView contentContainerStyle={styles.grid}>
                {categories.map((cat) => {
                  const screens = getScreenTypesForCategory(cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[
                        styles.tile,
                        { borderColor: CATEGORY_COLORS[cat] ?? COLORS.textMuted },
                      ]}
                      onPress={() => handleCategoryPress(cat)}
                    >
                      <View
                        style={[
                          styles.tileDot,
                          { backgroundColor: CATEGORY_COLORS[cat] ?? COLORS.textMuted },
                        ]}
                      />
                      <View style={styles.tileContent}>
                        <Text style={styles.tileText}>{cat.toUpperCase()}</Text>
                        <Text style={styles.tileCount}>
                          {screens.length} {screens.length === 1 ? "screen" : "screens"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>SELECT SCREEN TYPE</Text>

              {/* Random from category */}
              <Pressable
                style={[styles.screenTile, { borderColor: catColor }]}
                onPress={() => {
                  onSelectCategory(selectedCategory);
                  handleClose();
                }}
              >
                <Text style={[styles.screenRandom, { color: catColor }]}>RANDOM</Text>
                <Text style={styles.screenRules}>Any screen from {selectedCategory}</Text>
              </Pressable>

              <ScrollView contentContainerStyle={styles.screenList}>
                {screenTypes.map((st) => (
                  <Pressable
                    key={st.screenType}
                    style={[styles.screenTile, { borderColor: `${catColor}60` }]}
                    onPress={() => handleScreenPress(st.screenType)}
                  >
                    <Text style={styles.screenName}>{st.screenType}</Text>
                    <Text style={styles.screenRules}>
                      {st.rules.join(", ")} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
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
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
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
  tileContent: {
    gap: 2,
  },
  tileText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.white,
  },
  tileCount: {
    fontSize: 9,
    fontFamily: FONTS.regular,
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  screenList: {
    gap: 8,
    paddingBottom: 20,
  },
  screenTile: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 8,
  },
  screenName: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.white,
  },
  screenRandom: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 3,
  },
  screenRules: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export default memo(DevScreen);