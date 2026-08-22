import React from "react";
import { StyleSheet, View, Switch, Alert } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeContext";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@/theme/palette";

export function SettingsScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const setTheme = useAuthStore((s) => s.setTheme);
  const logout = useAuthStore((s) => s.logout);

  const isDark = (user?.theme ?? "DARK") === "DARK";

  const confirmLogout = () => {
    Alert.alert("Esci dall'account", "Sei sicuro di voler uscire?", [
      { text: "Annulla", style: "cancel" },
      { text: "Esci", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <Text variant="title" size={24} style={{ marginBottom: spacing.lg }}>
        Impostazioni
      </Text>

      <Card>
        <View style={styles.row}>
          <View>
            <Text variant="bodyMedium">Tema scuro</Text>
            <Text variant="muted" size={12}>
              Attiva la palette "detective noir"
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? "DARK" : "LIGHT")}
            thumbColor={theme.accentGold}
            trackColor={{ true: theme.surfaceAlt, false: theme.surfaceAlt }}
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md } as any}>
        <Text variant="bodyMedium">Account</Text>
        <Text variant="muted" size={12} style={{ marginTop: 4 }}>
          {user?.email}
        </Text>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Esci dall'account" variant="danger" onPress={confirmLogout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
