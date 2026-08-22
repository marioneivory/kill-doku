import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { Text } from "./Text";
import { GridCellDTO } from "@/types/api";
import { usePuzzleStore } from "@/store/puzzleStore";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 40;

interface PuzzleGridProps {
  gridSize: number;
  gridCells: GridCellDTO[];
  characterNameById: Record<string, string>;
  victimCharacterId: string | null;
}

/** Palette di colori distinguibili per area, derivata deterministicamente dal nome. */
function colorForArea(areaName: string, isDark: boolean): string {
  const hues = [340, 20, 45, 160, 200, 260, 300, 10, 90, 220];
  let hash = 0;
  for (let i = 0; i < areaName.length; i++) hash = (hash * 31 + areaName.charCodeAt(i)) % 1000;
  const hue = hues[hash % hues.length];
  return isDark ? `hsl(${hue}, 35%, 22%)` : `hsl(${hue}, 55%, 88%)`;
}

export function PuzzleGrid({
  gridSize,
  gridCells,
  characterNameById,
  victimCharacterId,
}: PuzzleGridProps) {
  const theme = useTheme();
  const placementByCell = usePuzzleStore((s) => s.placementByCell);
  const placeAt = usePuzzleStore((s) => s.placeAt);
  const clearCell = usePuzzleStore((s) => s.clearCell);

  const cellSize = Math.floor((SCREEN_WIDTH - GRID_PADDING) / gridSize);

  const cellByKey = new Map(gridCells.map((c) => [`${c.row},${c.col}`, c]));

  return (
    <View
      style={[
        styles.grid,
        { width: cellSize * gridSize, borderColor: theme.border },
      ]}
    >
      {Array.from({ length: gridSize }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: gridSize }).map((_, col) => {
            const key = `${row},${col}`;
            const cell = cellByKey.get(key);
            const occupiable = cell?.isOccupiable ?? false;
            const placedCharacterId = placementByCell[key];
            const isVictimHere =
              !!placedCharacterId && placedCharacterId === victimCharacterId;

            return (
              <Pressable
                key={key}
                onPress={() => {
                  if (!occupiable) return;
                  if (placedCharacterId) clearCell(row, col);
                  else placeAt(row, col);
                }}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: !occupiable
                      ? theme.surfaceAlt
                      : colorForArea(cell!.areaName, theme.mode === "dark"),
                    borderColor: theme.border,
                  },
                ]}
              >
                {!occupiable && cell?.objectKey && (
                  <Text size={9} variant="muted" numberOfLines={1}>
                    {cell.objectKey}
                  </Text>
                )}
                {placedCharacterId && (
                  <View
                    style={[
                      styles.token,
                      {
                        backgroundColor: isVictimHere
                          ? theme.accentBlood
                          : theme.accentGold,
                      },
                    ]}
                  >
                    <Text
                      size={10}
                      variant="bodyBold"
                      color={theme.mode === "dark" ? "#1A1A1D" : "#FFFFFF"}
                      numberOfLines={1}
                    >
                      {characterNameById[placedCharacterId]?.slice(0, 3) ?? "?"}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { borderWidth: 2, borderRadius: 8, overflow: "hidden" },
  row: { flexDirection: "row" },
  cell: {
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  token: {
    width: "78%",
    height: "78%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
