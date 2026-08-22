import React, { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const PARTICLES = ["🎉", "⭐", "🕵️", "✨", "🏅", "🎉", "⭐", "✨"];

/**
 * Celebrazione a "particelle" costruita con react-native-reanimated.
 * Sostituisce un asset Lottie dedicato (nessun asset grafico fornito nel
 * progetto): la spec stessa prevede questo fallback ("animazioni native
 * se Lottie non è disponibile"). Se in futuro verranno forniti asset
 * Lottie reali, questo componente può essere sostituito 1:1 da un
 * <LottieView autoPlay loop={false} source={...} /> senza toccare i
 * punti di chiamata (badge sbloccato, capitolo completato).
 */
export function CelebrationBurst({ trigger }: { trigger: boolean }) {
  const { width } = useWindowDimensions();

  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((emoji, i) => (
        <Particle key={i} emoji={emoji} index={i} containerWidth={width} />
      ))}
    </View>
  );
}

function Particle({
  emoji,
  index,
  containerWidth,
}: {
  emoji: string;
  index: number;
  containerWidth: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const startX = (containerWidth / PARTICLES.length) * index + 10;

  useEffect(() => {
    translateY.value = withDelay(
      index * 60,
      withTiming(-220, { duration: 1400, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withDelay(index * 60 + 900, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        { position: "absolute", left: startX, bottom: 80, fontSize: 24 },
        style,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}
