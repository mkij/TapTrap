import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const CENTER_Y = height * 0.5;

interface AmbientBackgroundProps {
  accentColor: string;
}

const LAYERS = [
  { size: width * 0.3, opacity: 0.08 },
  { size: width * 0.5, opacity: 0.05 },
  { size: width * 0.75, opacity: 0.03 },
  { size: width * 1.0, opacity: 0.02 },
  { size: width * 1.3, opacity: 0.01 },
  { size: width * 1.6, opacity: 0.005 },
];

function AmbientBackground({ accentColor }: AmbientBackgroundProps) {
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [breatheAnim]);

  const scale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const opacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.glowGroup,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        {LAYERS.map((layer, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: layer.size,
              height: layer.size,
              borderRadius: layer.size / 2,
              backgroundColor: accentColor,
              opacity: layer.opacity,
              top: CENTER_Y - layer.size / 2,
              left: width / 2 - layer.size / 2,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

export default React.memo(AmbientBackground);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: "hidden",
  },
  glowGroup: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});