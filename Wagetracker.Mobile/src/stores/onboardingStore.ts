import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const ONBOARDING_COMPLETED_KEY = 'chickaree_onboarding_completed_v1';

const isWeb = Platform.OS === 'web';

const storage = {
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

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    isOnboardingLoading: boolean;
    checkOnboardingStatus: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    hasCompletedOnboarding: false,
    isOnboardingLoading: true,

    checkOnboardingStatus: async () => {
        set({ isOnboardingLoading: true });

        try {
            const completed = await storage.getItem(ONBOARDING_COMPLETED_KEY);
            set({
                hasCompletedOnboarding: completed === 'true',
                isOnboardingLoading: false,
            });
        } catch (error) {
            console.warn('Failed to read onboarding status:', error);
            set({
                hasCompletedOnboarding: false,
                isOnboardingLoading: false,
            });
        }
    },

    completeOnboarding: async () => {
        try {
            await storage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        } catch (error) {
            console.warn('Failed to save onboarding status:', error);
        } finally {
            set({
                hasCompletedOnboarding: true,
                isOnboardingLoading: false,
            });
        }
    },

    resetOnboarding: async () => {
        try {
            await storage.removeItem(ONBOARDING_COMPLETED_KEY);
        } catch (error) {
            console.warn('Failed to reset onboarding status:', error);
        } finally {
            set({
                hasCompletedOnboarding: false,
                isOnboardingLoading: false,
            });
        }
    },
}));
