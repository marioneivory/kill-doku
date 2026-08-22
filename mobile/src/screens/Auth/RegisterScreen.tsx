import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { AuthStackParamList } from "@/navigation/types";
import { spacing } from "@/theme/palette";
import { useTheme } from "@/theme/ThemeContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  const handleSubmit = async () => {
    try {
      await register(email.trim(), password);
    } catch {
      // Errore già mostrato via store.
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title" size={30} color={theme.accentGold}>
          Nuova indagine
        </Text>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>
          Crea un account per salvare i tuoi progressi.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder="Password (min. 8 caratteri)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: spacing.sm }}
        />
        <Input
          placeholder="Conferma password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{ marginTop: spacing.sm }}
        />

        {password.length > 0 && !passwordLongEnough && (
          <Text color={theme.danger} style={{ marginTop: spacing.xs }}>
            La password deve avere almeno 8 caratteri.
          </Text>
        )}
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text color={theme.danger} style={{ marginTop: spacing.xs }}>
            Le password non coincidono.
          </Text>
        )}
        {error && (
          <Text color={theme.danger} style={{ marginTop: spacing.sm }}>
            {error}
          </Text>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label="Crea account"
            onPress={handleSubmit}
            loading={status === "loading"}
            disabled={!email || !passwordsMatch || !passwordLongEnough}
          />
        </View>

        <Button
          label="Hai già un account? Accedi"
          variant="secondary"
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
});
