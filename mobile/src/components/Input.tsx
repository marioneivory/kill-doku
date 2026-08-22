import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { fonts, radii, spacing } from "@/theme/palette";

export function Input(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      style={[
        styles.base,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.textPrimary,
        },
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontFamily: fonts.body,
    fontSize: 15,
    width: "100%",
  },
});
