import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PuzzleGrid } from "@/components/PuzzleGrid";
import { CluePanel } from "@/components/CluePanel";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/palette";
import { usePuzzleStore } from "@/store/puzzleStore";
import { PlacementEntry, PuzzleDTO, SubmissionResultDTO } from "@/types/api";

interface PuzzleBoardProps {
  puzzle: PuzzleDTO;
  submitting: boolean;
  onSubmit: (placement: PlacementEntry[]) => Promise<void>;
  result: (SubmissionResultDTO & { stars?: number; unlockedBadge?: any }) | null;
  onDismissResult: () => void;
  extraResultContent?: React.ReactNode;
}

export function PuzzleBoard({
  puzzle,
  submitting,
  onSubmit,
  result,
  onDismissResult,
  extraResultContent,
}: PuzzleBoardProps) {
  const theme = useTheme();
  const loadPuzzle = usePuzzleStore((s) => s.loadPuzzle);
  const getPlacementEntries = usePuzzleStore((s) => s.getPlacementEntries);
  const puzzleInStore = usePuzzleStore((s) => s.puzzle);

  useEffect(() => {
    if (puzzleInStore?.id !== puzzle.id) {
      loadPuzzle(puzzle);
    }
  }, [puzzle.id]);

  const characterNameById = Object.fromEntries(
    puzzle.characters.map((c) => [c.id, c.name])
  );
  const victim = puzzle.characters.find((c) => c.isVictim) ?? null;

  const allPlaced =
    Object.keys(usePuzzleStore.getState().placementByCell).length ===
    puzzle.characters.length;

  const handleVerify = async () => {
    const placement = getPlacementEntries();
    await onSubmit(placement);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleRegular" size={20}>
            {puzzle.title}
          </Text>
          <Text variant="muted" style={{ marginTop: 2 }}>
            {puzzle.theme} · Griglia {puzzle.gridSize}×{puzzle.gridSize}
          </Text>
        </View>
        {victim && (
          <View style={[styles.victimTag, { borderColor: theme.accentBlood }]}>
            <Text size={11} color={theme.accentBlood}>
              Vittima: {victim.name}
            </Text>
          </View>
        )}
      </View>

      <Text variant="muted" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
        {puzzle.introText}
      </Text>

      <View style={styles.gridWrapper}>
        <PuzzleGrid
          gridSize={puzzle.gridSize}
          gridCells={puzzle.gridCells}
          characterNameById={characterNameById}
          victimCharacterId={victim?.id ?? null}
        />
      </View>

      <Text variant="bodyMedium" style={{ marginTop: spacing.md }}>
        Sospettati
      </Text>
      <CluePanel characters={puzzle.characters} />

      <View style={{ marginTop: spacing.md }}>
        <Button
          label="Verifica soluzione"
          onPress={handleVerify}
          loading={submitting}
          disabled={!allPlaced || submitting}
        />
      </View>

      {result && (
        <Card
          highlighted
          style={{ marginTop: spacing.md, borderColor: result.correct ? theme.success : theme.danger } as any}
        >
          <Text variant="bodyBold" color={result.correct ? theme.success : theme.danger}>
            {result.correct ? "Caso risolto!" : "Non ancora corretto."}
          </Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>
            {result.correct
              ? "Tutti i sospettati sono nella posizione esatta."
              : "Alcune posizioni non coincidono con la soluzione. Rivedi gli indizi."}
          </Text>
          {result.correct && result.killerCharacterId && (
            <Text style={{ marginTop: spacing.xs }}>
              L'assassino è: {characterNameById[result.killerCharacterId]}
            </Text>
          )}
          {extraResultContent}
          <View style={{ marginTop: spacing.sm }}>
            <Button label="Continua" variant="secondary" onPress={onDismissResult} />
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  victimTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  gridWrapper: { alignItems: "center", marginTop: spacing.sm },
});
