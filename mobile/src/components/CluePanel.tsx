import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { Text } from "./Text";
import { Card } from "./Card";
import { CharacterDTO } from "@/types/api";
import { usePuzzleStore } from "@/store/puzzleStore";
import { spacing } from "@/theme/palette";

interface CluePanelProps {
  characters: CharacterDTO[];
}

export function CluePanel({ characters }: CluePanelProps) {
  const theme = useTheme();
  const selectedCharacterId = usePuzzleStore((s) => s.selectedCharacterId);
  const selectCharacter = usePuzzleStore((s) => s.selectCharacter);
  const placementByCell = usePuzzleStore((s) => s.placementByCell);

  const placedCharacterIds = new Set(Object.values(placementByCell));

  return (
    <FlatList
      horizontal
      data={characters}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedCharacterId;
        const isPlaced = placedCharacterIds.has(item.id);
        return (
          <Pressable onPress={() => selectCharacter(item.id)}>
            <Card
              highlighted={isSelected}
              style={[styles.card, isPlaced && { opacity: 0.55 }] as any}
            >
              <View style={styles.headerRow}>
                <Text variant="bodyBold" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isVictim && (
                  <View style={[styles.badge, { backgroundColor: theme.accentBlood }]}>
                    <Text size={10} color="#F2EFEA">
                      VITTIMA
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="muted" style={{ marginTop: spacing.xs }} numberOfLines={3}>
                {item.clueText}
              </Text>
              {isPlaced && (
                <Text size={11} color={theme.success} style={{ marginTop: spacing.xs }}>
                  ✓ Piazzato
                </Text>
              )}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: { width: 220 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
