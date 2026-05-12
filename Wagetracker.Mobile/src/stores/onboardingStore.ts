import { create } from 'zustand';
import { storage } from '../utils/storage';

const ONBOARDING_COMPLETED_KEY = 'chickaree_onboarding_completed_v1';


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
