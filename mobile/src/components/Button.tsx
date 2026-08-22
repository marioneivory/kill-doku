import React from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/palette";
import { Text } from "./Text";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  fullWidth = true,
}: ButtonProps) {
  const theme = useTheme();

  const backgroundColor = {
    primary: theme.accentGold,
    secondary: theme.surfaceAlt,
    danger: theme.accentBlood,
    ghost: "transparent",
  }[variant];

  const textColor = {
    primary: theme.mode === "dark" ? "#1A1A1D" : "#FFFFFF",
    secondary: theme.textPrimary,
    danger: "#F2EFEA",
    ghost: theme.accentGold,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        fullWidth && styles.fullWidth,
        variant === "ghost" && { borderWidth: 1, borderColor: theme.accentGold },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="bodyBold" color={textColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { width: "100%" },
});
