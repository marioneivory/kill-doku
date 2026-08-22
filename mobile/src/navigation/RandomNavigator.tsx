import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RandomStackParamList } from "./types";
import { DifficultySelectScreen } from "@/screens/Random/DifficultySelectScreen";
import { RandomPuzzleScreen } from "@/screens/Random/RandomPuzzleScreen";
import { useTheme } from "@/theme/ThemeContext";

const Stack = createNativeStackNavigator<RandomStackParamList>();

export function RandomNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundElevated },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontFamily: "Inter_500Medium" },
      }}
    >
      <Stack.Screen
        name="DifficultySelect"
        component={DifficultySelectScreen}
        options={{ title: "Caso Casuale" }}
      />
      <Stack.Screen
        name="RandomPuzzle"
        component={RandomPuzzleScreen}
        options={{ title: "Indagine" }}
      />
    </Stack.Navigator>
  );
}
