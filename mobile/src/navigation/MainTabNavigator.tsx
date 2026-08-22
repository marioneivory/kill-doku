import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import { HomeScreen } from "@/screens/Home/HomeScreen";
import { StoryNavigator } from "./StoryNavigator";
import { RandomNavigator } from "./RandomNavigator";
import { ProfileScreen } from "@/screens/Profile/ProfileScreen";
import { SettingsScreen } from "@/screens/Settings/SettingsScreen";
import { useTheme } from "@/theme/ThemeContext";
import { Text } from "@/components/Text";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: "🏠",
  StoryTab: "🗺️",
  RandomTab: "🎲",
  Profile: "🕵️",
  Settings: "⚙️",
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: "Home",
  StoryTab: "Storia",
  RandomTab: "Random",
  Profile: "Profilo",
  Settings: "Opzioni",
};

export function MainTabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accentGold,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.backgroundElevated, borderTopColor: theme.border },
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
        tabBarIcon: () => <Text size={18}>{ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="StoryTab" component={StoryNavigator} />
      <Tab.Screen name="RandomTab" component={RandomNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
