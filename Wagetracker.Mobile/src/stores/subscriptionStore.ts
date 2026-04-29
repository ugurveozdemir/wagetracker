import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    INTRO_ELIGIBILITY_STATUS,
    IntroEligibility,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
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
    trialEligibility: Record<string, IntroEligibility>;
    bootstrap: (user: UserDto | null) => Promise<void>;
    getCustomerInfo: () => Promise<CustomerInfo | null>;
    hasActiveEntitlement: (customerInfo?: CustomerInfo | null) => boolean;
    hasEligibleFreeTrial: () => boolean;
    refreshTrialEligibility: (packages?: PurchasesPackage[]) => Promise<Record<string, IntroEligibility>>;
    refreshSubscriptionStatus: () => Promise<UserDto | null>;
    presentRevenueCatPaywall: () => Promise<PAYWALL_RESULT>;
    presentCustomerCenter: () => Promise<void>;
    redeemOfferCode: () => Promise<UserDto | null>;
    purchaseSelectedPackage: (selectedPackage: PurchasesPackage) => Promise<UserDto | null>;
    restorePurchases: () => Promise<UserDto | null>;
    clear: () => Promise<void>;
}

let customerInfoListenerRegistered = false;

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

const isPurchaseCancelled = (error: unknown) => {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('code' in error || 'userCancelled' in error) &&
        ((error as { code?: string }).code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
            (error as { userCancelled?: boolean | null }).userCancelled === true)
    );
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (isPurchaseCancelled(error)) {
        return 'Purchase cancelled.';
    }

    return error instanceof Error ? error.message : fallback;
};

const paywallCompletedAccessChange = (result: PAYWALL_RESULT) => {
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED || result === PAYWALL_RESULT.NOT_PRESENTED;
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
    trialEligibility: {},

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
                if (!customerInfoListenerRegistered) {
                    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
                        if (useSubscriptionStore.getState().isConfigured) {
                            useSubscriptionStore.setState({ lastCustomerInfo: customerInfo });
                        }
                    });
                    customerInfoListenerRegistered = true;
                }
            } else if (get().configuredCustomerId !== user.billingCustomerId) {
                await Purchases.logIn(user.billingCustomerId);
            }

            const [{ offerings, availablePackages }, customerInfo] = await Promise.all([
                loadOfferings(),
                Purchases.getCustomerInfo(),
            ]);
            const trialEligibility = await get().refreshTrialEligibility(availablePackages);

            set({
                offerings,
                availablePackages,
                isConfigured: true,
                configuredCustomerId: user.billingCustomerId,
                lastCustomerInfo: customerInfo,
                trialEligibility,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: getErrorMessage(error, 'Failed to configure subscriptions.'),
                isLoading: false,
            });
        }
    },

    getCustomerInfo: async () => {
        if (Platform.OS === 'web' || !get().isConfigured) {
            return null;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            set({ lastCustomerInfo: customerInfo, error: null });
            return customerInfo;
        } catch (error) {
            set({ error: getErrorMessage(error, 'Failed to retrieve customer info.') });
            return null;
        }
    },

    hasActiveEntitlement: (customerInfo) => {
        const info = customerInfo ?? get().lastCustomerInfo;
        return Boolean(info?.entitlements.active[config.REVENUECAT_ENTITLEMENT_ID]);
    },

    hasEligibleFreeTrial: () => {
        return get().availablePackages.some((pkg) => {
            const introPrice = pkg.product.introPrice;
            const eligibility = get().trialEligibility[pkg.product.identifier];
            return Boolean(
                introPrice &&
                introPrice.price === 0 &&
                introPrice.periodUnit === 'DAY' &&
                introPrice.periodNumberOfUnits === 3 &&
                eligibility?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
            );
        });
    },

    refreshTrialEligibility: async (packages) => {
        if (Platform.OS !== 'ios') {
            set({ trialEligibility: {} });
            return {};
        }

        const productIds = [...new Set((packages ?? get().availablePackages).map((pkg) => pkg.product.identifier))];
        if (productIds.length === 0) {
            set({ trialEligibility: {} });
            return {};
        }

        try {
            const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
            set({ trialEligibility: eligibility });
            return eligibility;
        } catch {
            set({ trialEligibility: {} });
            return {};
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
                set({ error: getErrorMessage(error, 'Failed to refresh customer info.') });
            }
        }

        try {
            const updatedUser = await subscriptionsApi.refresh();
            useAuthStore.getState().setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            set({ error: getErrorMessage(error, 'Failed to refresh subscription status.') });
            return null;
        }
    },

    presentRevenueCatPaywall: async () => {
        if (Platform.OS === 'web') {
            throw new Error('RevenueCat Paywalls require an iOS or Android build.');
        }

        if (!get().isConfigured) {
            throw new Error('RevenueCat is not configured yet.');
        }

        set({ isPurchasing: true, error: null });
        try {
            const result = await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: config.REVENUECAT_ENTITLEMENT_ID,
                offering: get().offerings?.current ?? undefined,
                displayCloseButton: true,
            });

            const customerInfo = await get().getCustomerInfo();
            if (paywallCompletedAccessChange(result) || get().hasActiveEntitlement(customerInfo)) {
                await get().refreshSubscriptionStatus();
            }

            set({ isPurchasing: false });
            return result;
        } catch (error) {
            set({
                isPurchasing: false,
                error: getErrorMessage(error, 'Failed to present RevenueCat Paywall.'),
            });
            throw error;
        }
    },

    presentCustomerCenter: async () => {
        if (Platform.OS === 'web') {
            throw new Error('RevenueCat Customer Center requires an iOS or Android build.');
        }

        if (!get().isConfigured) {
            throw new Error('RevenueCat is not configured yet.');
        }

        set({ isPurchasing: true, error: null });
        try {
            await RevenueCatUI.presentCustomerCenter({
                callbacks: {
                    onRestoreCompleted: ({ customerInfo }) => {
                        set({ lastCustomerInfo: customerInfo });
                    },
                    onRestoreFailed: ({ error }) => {
                        set({ error: error.message });
                    },
                },
            });

            await get().getCustomerInfo();
            await get().refreshSubscriptionStatus();
            set({ isPurchasing: false });
        } catch (error) {
            set({
                isPurchasing: false,
                error: getErrorMessage(error, 'Failed to open Customer Center.'),
            });
            throw error;
        }
    },

    redeemOfferCode: async () => {
        if (Platform.OS !== 'ios') {
            throw new Error('Offer codes are available on iOS only.');
        }

        if (!get().isConfigured) {
            throw new Error('RevenueCat is not configured yet.');
        }

        set({ isPurchasing: true, error: null });
        try {
            await Purchases.presentCodeRedemptionSheet();
            await Purchases.invalidateCustomerInfoCache();
            const customerInfo = await get().getCustomerInfo();
            const updatedUser = await get().refreshSubscriptionStatus();
            if (get().hasActiveEntitlement(customerInfo)) {
                set({ isPurchasing: false });
                return updatedUser;
            }

            set({ isPurchasing: false });
            return updatedUser;
        } catch (error) {
            set({
                isPurchasing: false,
                error: getErrorMessage(error, 'Failed to redeem offer code.'),
            });
            throw error;
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
            const message = getErrorMessage(error, 'Purchase failed.');
            set({
                isPurchasing: false,
                error: message,
            });
            if (isPurchaseCancelled(error)) {
                return null;
            }
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
                error: getErrorMessage(error, 'Restore failed.'),
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
            trialEligibility: {},
        });
    },
}));
