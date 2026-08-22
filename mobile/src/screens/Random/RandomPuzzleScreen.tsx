import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { apiGetRandomPuzzle, apiSubmitRandomPuzzle } from "@/api/random";
import { PlacementEntry, PuzzleDTO, SubmissionResultDTO } from "@/types/api";
import { RandomStackParamList } from "@/navigation/types";
import { useTheme } from "@/theme/ThemeContext";
import { usePuzzleStore } from "@/store/puzzleStore";

type Props = NativeStackScreenProps<RandomStackParamList, "RandomPuzzle">;

export function RandomPuzzleScreen({ route }: Props) {
  const { difficulty } = route.params;
  const theme = useTheme();
  const [puzzle, setPuzzle] = useState<PuzzleDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResultDTO | null>(null);
  const getElapsedSeconds = usePuzzleStore((s) => s.getElapsedSeconds);

  useEffect(() => {
    loadNewPuzzle();
  }, [difficulty]);

  async function loadNewPuzzle() {
    setPuzzle(null);
    setResult(null);
    const p = await apiGetRandomPuzzle(difficulty);
    setPuzzle(p);
  }

  const handleSubmit = async (placement: PlacementEntry[]) => {
    if (!puzzle) return;
    setSubmitting(true);
    try {
      const res = await apiSubmitRandomPuzzle(
        puzzle.id,
        placement,
        getElapsedSeconds()
      );
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (result?.correct) {
      loadNewPuzzle();
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
      />
    </Screen>
  );
}
