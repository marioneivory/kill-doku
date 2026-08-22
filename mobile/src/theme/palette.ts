/**
 * Identità visiva Kill-Doku (punto 9 della spec): mystery "cozy crime",
 * mai violenta. Palette scura antracite/nero + oro/rosso scuro per accenti
 * interattivi; palette chiara crema/bianco sporco con gli stessi accenti
 * per coerenza di brand. Valori scelti per contrasto AA su testo e touch target.
 */

export interface ThemePalette {
  mode: "dark" | "light";
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentGold: string;
  accentBlood: string;
  success: string;
  danger: string;
  overlay: string;
}

export const darkPalette: ThemePalette = {
  mode: "dark",
  background: "#121214", // antracite quasi nero
  backgroundElevated: "#1A1A1D",
  surface: "#232326",
  surfaceAlt: "#2C2C30",
  border: "#3A3A40",
  textPrimary: "#F2EFEA", // avorio caldo, non bianco puro (meno affaticante)
  textSecondary: "#B7B2AA",
  textMuted: "#7C7871",
  accentGold: "#C9A24B", // oro anticato — elementi interattivi primari
  accentBlood: "#7A1E22", // rosso sangue scuro — accenti/allerta a tema
  success: "#4C8C5B",
  danger: "#B3423B",
  overlay: "rgba(0,0,0,0.65)",
};

export const lightPalette: ThemePalette = {
  mode: "light",
  background: "#F5F1E8", // crema
  backgroundElevated: "#FBF8F1",
  surface: "#FFFFFF",
  surfaceAlt: "#EDE7D8",
  border: "#DCD3BE",
  textPrimary: "#231F1A",
  textSecondary: "#4A443C",
  textMuted: "#7C7367",
  accentGold: "#9C7A2E", // oro più scuro per contrasto su sfondo chiaro
  accentBlood: "#8C2A2A",
  success: "#3D7A4C",
  danger: "#A6332C",
  overlay: "rgba(20,16,10,0.5)",
};

export const fonts = {
  // Serif "investigativa" per titoli, sans-serif leggibile per la UI.
  // Caricati via expo-font da Google Fonts nel modulo useAppFonts.
  title: "PlayfairDisplay_700Bold",
  titleRegular: "PlayfairDisplay_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodyBold: "Inter_700Bold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};
