import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/theme/ThemeContext";

export function RootNavigator() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, []);

  const navigationTheme = {
    ...(theme.mode === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.backgroundElevated,
      text: theme.textPrimary,
      border: theme.border,
      primary: theme.accentGold,
    },
  };

  if (status === "idle" || status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accentGold} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme as any}>
      {status === "authenticated" ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
