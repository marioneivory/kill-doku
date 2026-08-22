import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { apiForgotPassword } from "@/api/auth";
import { AuthStackParamList } from "@/navigation/types";
import { spacing } from "@/theme/palette";
import { useTheme } from "@/theme/ThemeContext";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiForgotPassword(email.trim());
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title" size={28} color={theme.accentGold}>
          Recupero password
        </Text>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>
          Inserisci la tua email: se registrata, riceverai le istruzioni per
          reimpostare la password.
        </Text>
      </View>

      {sent ? (
        <Text style={{ marginTop: spacing.lg }}>
          Controlla la tua casella email nei prossimi minuti.
        </Text>
      ) : (
        <View style={styles.form}>
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label="Invia istruzioni"
              onPress={handleSubmit}
              loading={loading}
              disabled={!email}
            />
          </View>
        </View>
      )}

      <Button label="Torna al login" variant="ghost" onPress={() => navigation.navigate("Login")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
});
