import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { apiGetStoryLevel, apiSubmitStoryLevel } from "@/api/story";
import { PlacementEntry, PuzzleDTO, StoryLevelSubmissionResultDTO } from "@/types/api";
import { StoryStackParamList } from "@/navigation/types";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/palette";

type Props = NativeStackScreenProps<StoryStackParamList, "StoryPuzzle">;

export function StoryPuzzleScreen({ route, navigation }: Props) {
  const { chapterNumber, levelNumber } = route.params;
  const theme = useTheme();
  const [puzzle, setPuzzle] = useState<PuzzleDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StoryLevelSubmissionResultDTO | null>(null);

  useEffect(() => {
    apiGetStoryLevel(chapterNumber, levelNumber).then(setPuzzle);
  }, [chapterNumber, levelNumber]);

  const handleSubmit = async (placement: PlacementEntry[]) => {
    setSubmitting(true);
    try {
      const res = await apiSubmitStoryLevel(chapterNumber, levelNumber, placement);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (result?.correct) {
      navigation.goBack();
    } else {
      setResult(null);
    }
  };

  if (!puzzle) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accentGold} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <PuzzleBoard
        puzzle={puzzle}
        submitting={submitting}
        onSubmit={handleSubmit}
        result={result}
        onDismissResult={handleDismiss}
        extraResultContent={
          result?.correct ? (
            <>
              <Text style={{ marginTop: spacing.xs }}>
                Stelle guadagnate: {"★".repeat(result.stars)}
              </Text>
              {result.unlockedBadge && (
                <Text color={theme.accentGold} style={{ marginTop: spacing.xs }}>
                  🏅 Sbloccato: {result.unlockedBadge.name}
                </Text>
              )}
            </>
          ) : null
        }
      />
    </Screen>
  );
}
