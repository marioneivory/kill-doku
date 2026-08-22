import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Button } from "@/components/Button";
import { RandomStackParamList } from "@/navigation/types";
import { spacing } from "@/theme/palette";

type Props = NativeStackScreenProps<RandomStackParamList, "DifficultySelect">;

const DIFFICULTIES: Array<{
  value: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  label: string;
  description: string;
}> = [
  { value: "EASY", label: "Facile", description: "Griglia 6×6, 4 sospettati" },
  { value: "MEDIUM", label: "Media", description: "Griglia 8×8, 6 sospettati" },
  { value: "HARD", label: "Difficile", description: "Griglia 10×10, 8 sospettati" },
  { value: "EXPERT", label: "Esperto", description: "Griglia 12×12, 11 sospettati" },
];

export function DifficultySelectScreen({ navigation }: Props) {
  return (
    <Screen>
      <Text variant="title" size={24} style={{ marginBottom: spacing.xs }}>
        Caso Casuale
      </Text>
      <Text variant="muted" style={{ marginBottom: spacing.lg }}>
        Scegli la difficoltà per generare un nuovo mistero.
      </Text>

      <View style={{ gap: spacing.sm }}>
        {DIFFICULTIES.map((d) => (
          <View key={d.value}>
            <Button
              label={`${d.label} — ${d.description}`}
              variant="secondary"
              onPress={() => navigation.navigate("RandomPuzzle", { difficulty: d.value })}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}
