import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { apiGetProgress } from "@/api/user";
import { StoryStackParamList } from "@/navigation/types";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radii } from "@/theme/palette";

type Props = NativeStackScreenProps<StoryStackParamList, "LevelList">;

const LEVELS_PER_CHAPTER = 50;

type LevelStatus = "LOCKED" | "UNLOCKED" | "COMPLETED";

export function LevelListScreen({ route, navigation }: Props) {
  const { chapterNumber } = route.params;
  const theme = useTheme();
  const [levelData, setLevelData] = useState<
    Record<number, { status: LevelStatus; stars: number }> | null
  >(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    load();
    return unsubscribe;
  }, [navigation]);

  async function load() {
    const progress = await apiGetProgress();
    const map: Record<number, { status: LevelStatus; stars: number }> = {};
    for (const lvl of progress.story.levels) {
      if (lvl.chapterNumber === chapterNumber) {
        map[lvl.levelNumber] = { status: lvl.status, stars: lvl.stars };
      }
    }
    setLevelData(map);
  }

  if (!levelData) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accentGold} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const levels = Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => i + 1);

  return (
    <Screen>
      <Text variant="title" size={22} style={{ marginBottom: spacing.md }}>
        Capitolo {chapterNumber}
      </Text>
      <FlatList
        data={levels}
        keyExtractor={(n) => String(n)}
        numColumns={5}
        columnWrapperStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}
        renderItem={({ item: levelNumber }) => {
          const info = levelData[levelNumber];
          const status: LevelStatus = info?.status ?? (levelNumber === 1 ? "UNLOCKED" : "LOCKED");
          const isLocked = status === "LOCKED";
          const isCompleted = status === "COMPLETED";

          return (
            <Pressable
              disabled={isLocked}
              onPress={() =>
                navigation.navigate("StoryPuzzle", { chapterNumber, levelNumber })
              }
              style={[
                styles.node,
                {
                  backgroundColor: isCompleted
                    ? theme.accentGold
                    : isLocked
                      ? theme.surfaceAlt
                      : theme.surface,
                  borderColor: theme.border,
                  opacity: isLocked ? 0.4 : 1,
                },
              ]}
            >
              <Text
                variant="bodyBold"
                size={13}
                color={isCompleted ? (theme.mode === "dark" ? "#1A1A1D" : "#FFF") : theme.textPrimary}
              >
                {levelNumber}
              </Text>
              {isCompleted && <Text size={10}>{"★".repeat(info?.stars ?? 0)}</Text>}
              {isLocked && <Text size={12}>🔒</Text>}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  node: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
