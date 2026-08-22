import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StoryStackParamList } from "./types";
import { ChapterMapScreen } from "@/screens/Story/ChapterMapScreen";
import { LevelListScreen } from "@/screens/Story/LevelListScreen";
import { StoryPuzzleScreen } from "@/screens/Story/StoryPuzzleScreen";
import { useTheme } from "@/theme/ThemeContext";

const Stack = createNativeStackNavigator<StoryStackParamList>();

export function StoryNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundElevated },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontFamily: "Inter_500Medium" },
      }}
    >
      <Stack.Screen name="ChapterMap" component={ChapterMapScreen} options={{ title: "Capitoli" }} />
      <Stack.Screen name="LevelList" component={LevelListScreen} options={{ title: "Livelli" }} />
      <Stack.Screen name="StoryPuzzle" component={StoryPuzzleScreen} options={{ title: "Indagine" }} />
    </Stack.Navigator>
  );
}
