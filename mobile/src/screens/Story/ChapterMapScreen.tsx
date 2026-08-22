import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { apiGetChapters } from "@/api/story";
import { ChapterOverviewDTO } from "@/types/api";
import { StoryStackParamList } from "@/navigation/types";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/palette";

type Props = NativeStackScreenProps<StoryStackParamList, "ChapterMap">;

export function ChapterMapScreen({ navigation }: Props) {
  const theme = useTheme();
  const [chapters, setChapters] = useState<ChapterOverviewDTO[] | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    load();
    return unsubscribe;
  }, [navigation]);

  async function load() {
    const data = await apiGetChapters();
    setChapters(data);
  }

  if (!chapters) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accentGold} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title" size={24} style={{ marginBottom: spacing.md }}>
        Modalità Storia
      </Text>
      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item.chapterNumber)}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            disabled={!item.isUnlocked}
            onPress={() =>
              navigation.navigate("LevelList", { chapterNumber: item.chapterNumber })
            }
          >
            <Card style={{ opacity: item.isUnlocked ? 1 : 0.5 } as any}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold" size={17}>
                    {item.name}
                  </Text>
                  <Text variant="muted" style={{ marginTop: 4 }} numberOfLines={2}>
                    {item.flavorIntro}
                  </Text>
                  <Text size={12} color={theme.accentGold} style={{ marginTop: 6 }}>
                    {item.levelsCompleted}/{item.levelsCount} livelli completati
                  </Text>
                </View>
                {!item.isUnlocked && <Text size={20}>🔒</Text>}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
