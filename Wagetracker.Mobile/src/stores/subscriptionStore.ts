import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { subscriptionsApi } from '../api';
import { config } from '../config';
import { UserDto } from '../types';
import { useAuthStore } from './authStore';

interface SubscriptionState {
    offerings: PurchasesOfferings | null;
    availablePackages: PurchasesPackage[];
    isConfigured: boolean;
    configuredCustomerId: string | null;
    isLoading: boolean;
    isPurchasing: boolean;
    error: string | null;
    lastCustomerInfo: CustomerInfo | null;
    bootstrap: (user: UserDto | null) => Promise<void>;
    refreshSubscriptionStatus: () => Promise<UserDto | null>;
    purchaseSelectedPackage: (selectedPackage: PurchasesPackage) => Promise<UserDto | null>;
    restorePurchases: () => Promise<UserDto | null>;
    clear: () => Promise<void>;
}

const getRevenueCatApiKey = () => {
    if (Platform.OS === 'ios') {
        return config.REVENUECAT_IOS_API_KEY;
    }

    if (Platform.OS === 'android') {
        return config.REVENUECAT_ANDROID_API_KEY;
    }

    return '';
};

const loadOfferings = async () => {
    const offerings = await Purchases.getOfferings();
    return {
        offerings,
        availablePackages: offerings.current?.availablePackages ?? [],
    };
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    offerings: null,
    availablePackages: [],
    isConfigured: false,
    configuredCustomerId: null,
    isLoading: false,
    isPurchasing: false,
    error: null,
    lastCustomerInfo: null,

    bootstrap: async (user) => {
        if (!user) {
            await get().clear();
            return;
        }

        if (Platform.OS === 'web') {
            set({ offerings: null, availablePackages: [], error: null });
            return;
        }

        const apiKey = getRevenueCatApiKey();
        if (!apiKey) {
            set({ error: 'RevenueCat keys are not configured for this build.' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            if (!get().isConfigured) {
                await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
                Purchases.configure({
                    apiKey,
                    appUserID: user.billingCustomerId,
                });
            } else if (get().configuredCustomerId !== user.billingCustomerId) {
                await Purchases.logIn(user.billingCustomerId);
            }

            const [{ offerings, availablePackages }, customerInfo] = await Promise.all([
                loadOfferings(),
                Purchases.getCustomerInfo(),
            ]);

            set({
                offerings,
                availablePackages,
                isConfigured: true,
                configuredCustomerId: user.billingCustomerId,
                lastCustomerInfo: customerInfo,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to configure subscriptions.',
                isLoading: false,
            });
        }
    },

    refreshSubscriptionStatus: async () => {
        const authUser = useAuthStore.getState().user;
        if (!authUser) {
            return null;
        }

        if (Platform.OS !== 'web' && get().isConfigured) {
            try {
                const customerInfo = await Purchases.getCustomerInfo();
                set({ lastCustomerInfo: customerInfo });
            } catch (error) {
                set({ error: error instanceof Error ? error.message : 'Failed to refresh customer info.' });
            }
        }

        try {
            const updatedUser = await subscriptionsApi.refresh();
            useAuthStore.getState().setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to refresh subscription status.' });
            return null;
        }
    },

    purchaseSelectedPackage: async (selectedPackage) => {
        set({ isPurchasing: true, error: null });
        try {
            const result = await Purchases.purchasePackage(selectedPackage);
            set({ lastCustomerInfo: result.customerInfo });
            const updatedUser = await get().refreshSubscriptionStatus();
            set({ isPurchasing: false });
            return updatedUser;
        } catch (error) {
            set({
                isPurchasing: false,
                error: error instanceof Error ? error.message : 'Purchase failed.',
            });
            throw error;
        }
    },

    restorePurchases: async () => {
        set({ isPurchasing: true, error: null });
        try {
            const customerInfo = await Purchases.restorePurchases();
            set({ lastCustomerInfo: customerInfo });
            const updatedUser = await get().refreshSubscriptionStatus();
            set({ isPurchasing: false });
            return updatedUser;
        } catch (error) {
            set({
                isPurchasing: false,
                error: error instanceof Error ? error.message : 'Restore failed.',
            });
            throw error;
        }
    },

    clear: async () => {
        if (Platform.OS !== 'web' && get().isConfigured) {
            try {
                await Purchases.logOut();
            } catch {
                // Best-effort cleanup only.
            }
        }

        set({
            offerings: null,
            availablePackages: [],
            isConfigured: false,
            configuredCustomerId: null,
            isLoading: false,
            isPurchasing: false,
            error: null,
            lastCustomerInfo: null,
        });
    },
}));
