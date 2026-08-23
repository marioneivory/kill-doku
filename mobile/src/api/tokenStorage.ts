import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "killdoku_access_token";
const REFRESH_TOKEN_KEY = "killdoku_refresh_token";

// SecureStore usa Keychain/Keystore e non è disponibile nel browser.
// Il target web usa localStorage; i target iOS/Android restano su SecureStore.
const isWeb = Platform.OS === "web";

async function webGet(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

async function webSet(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

async function webDelete(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  if (isWeb) {
    await webSet(ACCESS_TOKEN_KEY, accessToken);
    await webSet(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) return webGet(ACCESS_TOKEN_KEY);
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) return webGet(REFRESH_TOKEN_KEY);
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  if (isWeb) {
    await webDelete(ACCESS_TOKEN_KEY);
    await webDelete(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
