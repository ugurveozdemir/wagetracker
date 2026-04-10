import React, { useMemo } from 'react';
import {
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useSubscriptionStore } from '../stores';
import { config } from '../config';
import { colors } from '../theme';

type PaywallFeature = 'premium' | 'goals' | 'expenses' | 'jobs';
type PaywallSource = 'goals' | 'expenses' | 'job_limit' | 'locked_job' | 'profile' | 'dashboard';

interface SubscriptionPaywallProps {
    feature: PaywallFeature;
    source: PaywallSource;
    showBackButton?: boolean;
    onBackPress?: () => void;
    onSuccess?: () => void;
}

const featureCopy: Record<PaywallFeature, { eyebrow: string; title: string; body: string }> = {
    premium: {
        eyebrow: 'WageTracker Premium',
        title: 'Unlock your full money workspace.',
        body: 'Premium unlocks goals, expenses, and unlimited jobs across the app.',
    },
    goals: {
        eyebrow: 'Premium Goals',
        title: 'Set weekly income targets.',
        body: 'Upgrade to save weekly goals, track progress, and keep target history in the dashboard.',
    },
    expenses: {
        eyebrow: 'Premium Expenses',
        title: 'Track spending with the rest of your ledger.',
        body: 'Upgrade to log expenses, view weekly history, and compare income against spending.',
    },
    jobs: {
        eyebrow: 'Premium Jobs',
        title: 'Go beyond the free 2-job limit.',
        body: 'Premium keeps all jobs unlocked and lets you keep adding new roles without hitting the free-tier cap.',
    },
};

const sortWeight = (identifier: string) => {
    const normalized = identifier.toLowerCase();
    if (normalized.includes('annual') || normalized.includes('year')) return 3;
    if (normalized.includes('6') || normalized.includes('six')) return 2;
    return 1;
};

const getPlanLabel = (identifier: string) => {
    const normalized = identifier.toLowerCase();
    if (normalized.includes('annual') || normalized.includes('year')) return '12 Months';
    if (normalized.includes('6') || normalized.includes('six')) return '6 Months';
    return 'Monthly';
};

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
    feature,
    source,
    showBackButton = false,
    onBackPress,
    onSuccess,
}) => {
    const { user } = useAuthStore();
    const {
        availablePackages,
        isLoading,
        isPurchasing,
        error,
        purchaseSelectedPackage,
        restorePurchases,
        refreshSubscriptionStatus,
    } = useSubscriptionStore();

    const copy = featureCopy[feature];
    const packages = useMemo(
        () => [...availablePackages].sort((a, b) => sortWeight(b.identifier) - sortWeight(a.identifier)),
        [availablePackages]
    );

    const handlePurchase = async (selectedPackage: typeof packages[number]) => {
        try {
            await purchaseSelectedPackage(selectedPackage);
            Toast.show({
                type: 'success',
                text1: 'Premium Unlocked',
                text2: 'Your subscription access is active.',
                visibilityTime: 2200,
            });
            onSuccess?.();
        } catch (purchaseError) {
            Toast.show({
                type: 'error',
                text1: 'Purchase Failed',
                text2: purchaseError instanceof Error ? purchaseError.message : 'Please try again.',
                visibilityTime: 2800,
            });
        }
    };

    const handleRestore = async () => {
        try {
            const updatedUser = await restorePurchases();
            Toast.show({
                type: updatedUser?.subscription.isPremium ? 'success' : 'info',
                text1: updatedUser?.subscription.isPremium ? 'Purchases Restored' : 'No Active Subscription',
                text2: updatedUser?.subscription.isPremium
                    ? 'Your premium access has been restored.'
                    : 'No active subscription was found for this account.',
                visibilityTime: 2600,
            });
            if (updatedUser?.subscription.isPremium) {
                onSuccess?.();
            }
        } catch (restoreError) {
            Toast.show({
                type: 'error',
                text1: 'Restore Failed',
                text2: restoreError instanceof Error ? restoreError.message : 'Please try again.',
                visibilityTime: 2800,
            });
        }
    };

    const openManageUrl = async () => {
        const url = Platform.OS === 'ios'
            ? config.APP_STORE_SUBSCRIPTIONS_URL
            : config.PLAY_STORE_SUBSCRIPTIONS_URL;
        await Linking.openURL(url);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    {showBackButton ? (
                        <TouchableOpacity style={styles.backButton} activeOpacity={0.82} onPress={onBackPress}>
                            <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerSpacer} />
                    )}

                    <TouchableOpacity style={styles.syncButton} activeOpacity={0.82} onPress={refreshSubscriptionStatus}>
                        <MaterialIcons name="sync" size={18} color={colors.primary} />
                        <Text style={styles.syncText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
                    <Text style={styles.title}>{copy.title}</Text>
                    <Text style={styles.body}>{copy.body}</Text>

                    <View style={styles.bullets}>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={styles.bulletText}>Unlimited unlocked jobs</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={styles.bulletText}>Expenses and weekly history</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={styles.bulletText}>Weekly goals and premium dashboard cards</Text>
                        </View>
                    </View>
                </View>

                {user?.subscription.isPremium ? (
                    <View style={styles.activeCard}>
                        <Text style={styles.activeLabel}>Current plan</Text>
                        <Text style={styles.activeValue}>
                            {user.subscription.planTerm === 'annual'
                                ? '12 Months'
                                : user.subscription.planTerm === 'six_month'
                                    ? '6 Months'
                                    : user.subscription.planTerm === 'monthly'
                                        ? 'Monthly'
                                        : 'Premium'}
                        </Text>
                        <Text style={styles.activeMeta}>
                            Status: {user.subscription.status.replace('_', ' ')}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.planStack}>
                    {packages.map((pkg, index) => (
                        <TouchableOpacity
                            key={pkg.identifier}
                            activeOpacity={0.88}
                            style={[styles.planCard, index === 0 && styles.planCardFeatured]}
                            disabled={isPurchasing}
                            onPress={() => handlePurchase(pkg)}
                        >
                            <View style={styles.planHeader}>
                                <View>
                                    <Text style={styles.planTitle}>{getPlanLabel(pkg.identifier)}</Text>
                                    <Text style={styles.planSubtitle}>{pkg.product.description || 'Auto-renewing subscription'}</Text>
                                </View>
                                {index === 0 ? (
                                    <View style={styles.featuredPill}>
                                        <Text style={styles.featuredPillText}>Best Value</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceText}>{pkg.product.priceString}</Text>
                                <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.secondaryButton, isPurchasing && styles.secondaryButtonDisabled]}
                    activeOpacity={0.86}
                    disabled={isPurchasing}
                    onPress={handleRestore}
                >
                    <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={openManageUrl}>
                    <Text style={styles.secondaryButtonText}>Manage Subscription</Text>
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {isLoading ? <Text style={styles.helperText}>Loading offers...</Text> : null}
                {isPurchasing ? <Text style={styles.helperText}>Waiting for the store...</Text> : null}
                {!isLoading && packages.length === 0 ? (
                    <Text style={styles.helperText}>
                        No store packages are available yet. Finish RevenueCat and store setup, then refresh this screen.
                    </Text>
                ) : null}

                <Text style={styles.legalText}>
                    Purchases renew automatically unless cancelled before the renewal date. By subscribing, you agree to the Terms and Privacy Policy.
                </Text>

                <View style={styles.linksRow}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(config.TERMS_URL)}>
                        <Text style={styles.linkText}>Terms</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(config.PRIVACY_URL)}>
                        <Text style={styles.linkText}>Privacy</Text>
                    </TouchableOpacity>
                    <Text style={styles.sourceText}>Source: {source.replace('_', ' ')}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 48,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSpacer: {
        width: 42,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: colors.surfaceContainerLow,
    },
    syncText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    heroCard: {
        backgroundColor: colors.primary,
        borderRadius: 32,
        padding: 28,
        marginBottom: 20,
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.74)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginBottom: 10,
    },
    title: {
        color: colors.white,
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 10,
    },
    body: {
        color: 'rgba(255,255,255,0.88)',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    bullets: {
        gap: 10,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bulletText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    activeCard: {
        backgroundColor: '#fff5e8',
        borderRadius: 28,
        padding: 22,
        marginBottom: 18,
    },
    activeLabel: {
        color: '#ab3600',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginBottom: 8,
    },
    activeValue: {
        color: '#412100',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    activeMeta: {
        color: '#7a573d',
        fontSize: 14,
        fontWeight: '600',
    },
    planStack: {
        gap: 14,
        marginBottom: 18,
    },
    planCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: 28,
        padding: 22,
    },
    planCardFeatured: {
        borderWidth: 2,
        borderColor: '#ff8a00',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    planTitle: {
        color: colors.onSurface,
        fontSize: 24,
        fontWeight: '800',
    },
    planSubtitle: {
        color: colors.onSurfaceVariant,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
        maxWidth: 220,
    },
    featuredPill: {
        alignSelf: 'flex-start',
        backgroundColor: '#ff8a00',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    featuredPillText: {
        color: '#412100',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: '800',
    },
    secondaryButton: {
        minHeight: 58,
        borderRadius: 999,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    secondaryButtonDisabled: {
        opacity: 0.7,
    },
    secondaryButtonText: {
        color: colors.onSurface,
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: {
        color: colors.danger,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        marginBottom: 8,
    },
    helperText: {
        color: colors.onSurfaceVariant,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 8,
    },
    legalText: {
        color: colors.onSurfaceVariant,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 8,
        marginBottom: 16,
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
    },
    linkText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    sourceText: {
        color: colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '600',
    },
});
