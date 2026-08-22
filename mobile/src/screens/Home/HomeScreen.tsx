import React from "react";
import { StyleSheet, View, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { useTheme } from "@/theme/ThemeContext";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@/theme/palette";
import { MainTabParamList } from "@/navigation/types";
import { Pressable } from "react-native";

type Nav = BottomTabNavigationProp<MainTabParamList, "Home">;

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const setTheme = useAuthStore((s) => s.setTheme);

  const isDark = (user?.theme ?? "DARK") === "DARK";

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text variant="title" size={30} color={theme.accentGold}>
            Kill-Doku
          </Text>
          <Text variant="muted" style={{ marginTop: 2 }}>
            {user?.email}
          </Text>
        </View>
        <View style={styles.themeToggle}>
          <Text size={16}>{isDark ? "🌙" : "☀️"}</Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? "DARK" : "LIGHT")}
            thumbColor={theme.accentGold}
            trackColor={{ true: theme.surfaceAlt, false: theme.surfaceAlt }}
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Pressable onPress={() => navigation.navigate("StoryTab")}>
          <Card style={styles.modeCard as any}>
            <Text size={30}>🗺️</Text>
            <Text variant="bodyBold" size={18} style={{ marginTop: spacing.sm }}>
              Modalità Storia
            </Text>
            <Text variant="muted" style={{ marginTop: 4 }}>
              300 livelli, 6 casi ambientati in luoghi diversi.
            </Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("RandomTab")}>
          <Card style={styles.modeCard as any}>
            <Text size={30}>🎲</Text>
            <Text variant="bodyBold" size={18} style={{ marginTop: spacing.sm }}>
              Modalità Random
            </Text>
            <Text variant="muted" style={{ marginTop: 4 }}>
              Nuovi misteri generati all'infinito, a tua scelta di difficoltà.
            </Text>
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  themeToggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  modeCard: { padding: spacing.lg },
});
