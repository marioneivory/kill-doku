import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/palette";

export function Card({
  children,
  style,
  highlighted = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  highlighted?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.surface,
          borderColor: highlighted ? theme.accentGold : theme.border,
          borderWidth: highlighted ? 2 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
