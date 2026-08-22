import React from "react";
import { StyleProp, Text as RNText, TextStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { fonts } from "@/theme/palette";

type Variant = "title" | "titleRegular" | "body" | "bodyMedium" | "bodyBold" | "muted";

interface TextProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const FONT_BY_VARIANT: Record<Variant, string> = {
  title: fonts.title,
  titleRegular: fonts.titleRegular,
  body: fonts.body,
  bodyMedium: fonts.bodyMedium,
  bodyBold: fonts.bodyBold,
  muted: fonts.body,
};

const DEFAULT_SIZE: Record<Variant, number> = {
  title: 26,
  titleRegular: 20,
  body: 15,
  bodyMedium: 15,
  bodyBold: 15,
  muted: 13,
};

export function Text({ children, variant = "body", size, color, style, numberOfLines }: TextProps) {
  const theme = useTheme();
  const defaultColor = variant === "muted" ? theme.textMuted : theme.textPrimary;

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: FONT_BY_VARIANT[variant],
          fontSize: size ?? DEFAULT_SIZE[variant],
          color: color ?? defaultColor,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
