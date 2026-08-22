import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CelebrationBurst } from "@/components/CelebrationBurst";
import { apiGetProgress } from "@/api/user";
import { FullProgressDTO } from "@/types/api";
import { useTheme } from "@/theme/ThemeContext";
import { spacing } from "@/theme/palette";

const STORY_CHAPTERS_COUNT = 6;

export function ProfileScreen() {
  const theme = useTheme();
  const [progress, setProgress] = useState<FullProgressDTO | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    apiGetProgress().then((data) => {
      setProgress(data);
      // Piccola celebrazione se l'utente ha almeno un badge, come accento
      // di benvenuto sulla schermata progressi (non invasivo, one-shot).
      if (data.badges.length > 0) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2000);
      }
    });
  }, []);

  if (!progress) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accentGold} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const unlockedBadgeChapters = new Set(progress.badges.map((b) => b.chapterNumber));

  return (
    <Screen scroll>
      <CelebrationBurst trigger={celebrate} />
      <Text variant="title" size={26} style={{ marginBottom: spacing.lg }}>
        Il tuo dossier
      </Text>

      <Card>
        <Text variant="bodyBold">Modalità Storia</Text>
        <View style={styles.counterRow}>
          <AnimatedCounter value={progress.story.completedLevels} color={theme.accentGold} />
          <Text variant="muted" style={{ marginLeft: 6 }}>
            / {progress.story.totalLevels} livelli
          </Text>
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <AnimatedProgressBar progress={progress.story.progressRatio} />
        </View>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>
          {progress.story.totalStars} stelle raccolte in totale
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.md } as any}>
        <Text variant="bodyBold">Modalità Random</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <AnimatedCounter value={progress.random.puzzlesCompleted} size={22} />
            <Text variant="muted" size={11}>
              Puzzle risolti
            </Text>
          </View>
          <View style={styles.statItem}>
            <AnimatedCounter value={progress.random.currentStreak} size={22} color={theme.accentBlood} />
            <Text variant="muted" size={11}>
              Streak attuale
            </Text>
          </View>
          <View style={styles.statItem}>
            <AnimatedCounter value={progress.random.longestStreak} size={22} />
            <Text variant="muted" size={11}>
              Streak record
            </Text>
          </View>
          <View style={styles.statItem}>
            <AnimatedCounter
              value={Math.round(progress.random.averageTimeSeconds / 60)}
              size={22}
              suffix=" min"
            />
            <Text variant="muted" size={11}>
              Tempo medio
            </Text>
          </View>
        </View>
      </Card>

      <Text variant="bodyBold" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        Badge
      </Text>
      <FlatList
        data={Array.from({ length: STORY_CHAPTERS_COUNT }, (_, i) => i + 1)}
        keyExtractor={(n) => String(n)}
        numColumns={3}
        columnWrapperStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}
        scrollEnabled={false}
        renderItem={({ item: chapterNumber }) => {
          const unlocked = unlockedBadgeChapters.has(chapterNumber);
          const badge = progress.badges.find((b) => b.chapterNumber === chapterNumber);
          return (
            <Card style={[styles.badgeCard, !unlocked && { opacity: 0.35 }] as any}>
              <Text size={26}>{unlocked ? "🏅" : "🔒"}</Text>
              <Text size={11} variant="muted" style={{ textAlign: "center", marginTop: 4 }}>
                {badge?.name ?? `Capitolo ${chapterNumber}`}
              </Text>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.xs },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm, gap: spacing.md },
  statItem: { width: "40%" },
  badgeCard: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
});
