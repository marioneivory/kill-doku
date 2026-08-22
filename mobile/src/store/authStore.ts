import { create } from "zustand";
import { apiLogin, apiLogout, apiRegister } from "@/api/auth";
import { apiGetMe, apiSetTheme } from "@/api/user";
import { clearTokens, getRefreshToken, saveTokens } from "@/api/tokenStorage";
import { ThemeMode, UserProfile } from "@/types/api";

interface AuthState {
  user: UserProfile | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,

  // Al lancio dell'app: se esiste un token salvato, prova a recuperare il
  // profilo utente. Se il refresh automatico dell'interceptor fallisce
  // (refresh token scaduto/revocato), l'utente torna alla schermata di login.
  bootstrap: async () => {
    set({ status: "loading" });
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ status: "unauthenticated" });
        return;
      }
      const user = await apiGetMe();
      set({ user, status: "authenticated" });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const tokens = await apiLogin(email, password);
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      const user = await apiGetMe();
      set({ user, status: "authenticated" });
    } catch (err: any) {
      set({
        status: "unauthenticated",
        error: err?.response?.data?.error ?? "Accesso non riuscito.",
      });
      throw err;
    }
  },

  register: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const tokens = await apiRegister(email, password);
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      const user = await apiGetMe();
      set({ user, status: "authenticated" });
    } catch (err: any) {
      set({
        status: "unauthenticated",
        error: err?.response?.data?.error ?? "Registrazione non riuscita.",
      });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // Anche se la revoca server-side fallisce (es. offline), procediamo
        // comunque a cancellare i token locali: l'utente si aspetta di
        // uscire immediatamente dall'app.
      }
    }
    await clearTokens();
    set({ user: null, status: "unauthenticated" });
  },

  setTheme: async (theme) => {
    const previousUser = get().user;
    // Aggiornamento ottimistico per un feedback UI istantaneo sul toggle tema.
    if (previousUser) set({ user: { ...previousUser, theme } });
    try {
      await apiSetTheme(theme);
    } catch {
      if (previousUser) set({ user: previousUser });
    }
  },

  clearError: () => set({ error: null }),
}));
