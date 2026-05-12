/**
 * Shared platform-aware secure storage helper.
 *
 * On native (iOS/Android): expo-secure-store (device keychain / keystore).
 * On web: token operations use sessionStorage (cleared on tab close, not
 *   persisted to disk by the browser beyond the session), while general
 *   app data uses localStorage.
 *
 * ⚠️  Known limitation: sessionStorage is still accessible to JS running in
 *   the same origin, so XSS is a vector. The correct long-term fix is to move
 *   to httpOnly cookies (requires backend `/auth/refresh` endpoint changes).
 *   Until then, sessionStorage is a meaningful improvement over localStorage
 *   because it does not persist the token across browser sessions or tabs.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

/**
 * General-purpose persistent storage.
 * On web uses localStorage so data survives browser restarts (e.g. onboarding flag).
 * On native uses SecureStore.
 */
export const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (isWeb) {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (isWeb) {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (isWeb) {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

/**
 * Session-scoped token storage.
 * On web uses sessionStorage so the auth token is NOT persisted to disk and
 * is cleared automatically when the tab/window is closed.
 * On native uses SecureStore (same as general storage — hardware-backed).
 */
export const tokenStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (isWeb) {
            return sessionStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (isWeb) {
            sessionStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (isWeb) {
            sessionStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};
