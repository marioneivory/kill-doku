import React, { useEffect, useState } from "react";
import { Text } from "./Text";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  size?: number;
  color?: string;
  suffix?: string;
}

/**
 * Nota tecnica: reanimated non anima nativamente il contenuto testuale di
 * <Text> senza un componente Animated custom via createAnimatedComponent
 * su TextInput (workaround non banale per un semplice contatore). Per
 * questo il tween numerico usa un semplice requestAnimationFrame in JS,
 * mentre la barra di progresso (AnimatedProgressBar) usa reanimated per
 * l'animazione a thread nativo dove serve fluidità su gesture/scroll.
 */
export function AnimatedCounter({
  value,
  duration = 900,
  size = 28,
  color,
  suffix = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const from = display;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Text variant="bodyBold" size={size} color={color}>
      {display}
      {suffix}
    </Text>
  );
}
