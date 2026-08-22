import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeContext";
import { radii } from "@/theme/palette";

export function AnimatedProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: theme.accentGold }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: radii.pill, overflow: "hidden", width: "100%" },
  fill: { height: "100%", borderRadius: radii.pill },
});
