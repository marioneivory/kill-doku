import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkPalette, lightPalette, ThemePalette } from "./palette";
import { useAuthStore } from "@/store/authStore";

const ThemeContext = createContext<ThemePalette>(darkPalette);

/**
 * Risolve il tema attivo: se l'utente ha un override salvato lo usa,
 * altrimenti segue il tema di sistema al primo accesso (punto 3 della spec).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const userTheme = useAuthStore((s) => s.user?.theme);

  const palette = useMemo(() => {
    const effective = userTheme ?? (systemScheme === "light" ? "LIGHT" : "DARK");
    return effective === "LIGHT" ? lightPalette : darkPalette;
  }, [userTheme, systemScheme]);

  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemePalette {
  return useContext(ThemeContext);
}
