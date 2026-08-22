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

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      await login(email.trim(), password);
    } catch {
      // L'errore è già gestito e mostrato tramite lo store.
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title" size={34} color={theme.accentGold}>
          Kill-Doku
        </Text>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>
          Ogni indizio conta. Accedi per continuare le indagini.
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
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: spacing.sm }}
        />

        {error && (
          <Text color={theme.danger} style={{ marginTop: spacing.sm }}>
            {error}
          </Text>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label="Accedi"
            onPress={handleSubmit}
            loading={status === "loading"}
            disabled={!email || !password}
          />
        </View>

        <Button
          label="Password dimenticata?"
          variant="ghost"
          onPress={() => navigation.navigate("ForgotPassword")}
        />
        <Button
          label="Non hai un account? Registrati"
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
});
