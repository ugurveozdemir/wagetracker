import React, { useMemo } from 'react';
import {
    Linking,
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
import { colors, useResponsiveLayout } from '../theme';

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
        eyebrow: 'Chickaree Premium',
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
        body: 'Upgrade to log expenses, scan receipts, view weekly history, and compare income against spending.',
    },
    jobs: {
        eyebrow: 'Premium Jobs',
        title: 'Go beyond the free 2-job limit.',
        body: 'Premium keeps all jobs unlocked and lets you keep adding new roles without hitting the free-tier cap.',
    },
};

type PlanKind = 'monthly' | 'six_month' | 'annual' | 'unknown';

const getPlanKind = (identifier: string): PlanKind => {
    const normalized = identifier.toLowerCase();
    if (normalized.includes('annual') || normalized.includes('year') || normalized.includes('12')) return 'annual';
    if (normalized.includes('6') || normalized.includes('six')) return 'six_month';
    if (normalized.includes('month')) return 'monthly';
    return 'unknown';
};

const getPlanLabel = (identifier: string) => {
    const kind = getPlanKind(identifier);
    if (kind === 'annual') return 'Yearly';
    if (kind === 'six_month') return '6 Months';
    return 'Monthly';
};

const getPlanOrder = (identifier: string) => {
    const kind = getPlanKind(identifier);
    if (kind === 'monthly') return 0;
    if (kind === 'six_month') return 1;
    if (kind === 'annual') return 2;
    return 99;
};

const getPlanSupportCopy = (identifier: string) => {
    const kind = getPlanKind(identifier);

    if (kind === 'six_month') {
        return {
            eyebrow: 'Best offer for one full season',
            benefits: [
                'Unlimited jobs across your full season',
                'Receipt scan, expenses, and weekly history',
                'Weekly income goals and premium dashboard tools',
            ],
        };
    }

    if (kind === 'annual') {
        return {
            eyebrow: 'Built for long-term tracking',
            benefits: [
                'Unlimited jobs whenever you add a new role',
                'Receipt scan, expenses, and weekly history',
                'Weekly goals that stay available year-round',
            ],
        };
    }

    return {
        eyebrow: 'Start using every premium feature now',
        benefits: [
            'Unlimited jobs as soon as you upgrade',
            'Receipt scan, expenses, and weekly history',
            'Weekly goals and premium dashboard tools',
        ],
    };
};

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
    feature,
    showBackButton = false,
    onBackPress,
    onSuccess,
}) => {
    const { horizontalPadding, metrics, rfs, rs, rv } = useResponsiveLayout();
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
        () => [...availablePackages].sort((a, b) => getPlanOrder(a.identifier) - getPlanOrder(b.identifier)),
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
            const hasPremium = updatedUser?.subscription.isPremium;
            Toast.show({
                type: hasPremium ? 'success' : 'info',
                text1: hasPremium ? 'Purchases Restored' : 'No Active Subscription',
                text2: hasPremium
                    ? 'Premium access is active on this account.'
                    : 'No active subscription was found for this store account.',
                visibilityTime: 2400,
            });
            if (hasPremium) {
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingHorizontal: horizontalPadding,
                        paddingTop: rv(16, 0.74, 1),
                        paddingBottom: rv(48, 0.78, 1),
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { marginBottom: rv(18, 0.78, 1) }]}>
                    {showBackButton ? (
                        <TouchableOpacity style={[styles.backButton, { width: metrics.touchTarget, height: metrics.touchTarget, borderRadius: metrics.touchTarget / 2 }]} activeOpacity={0.82} onPress={onBackPress}>
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

                <View style={[styles.heroCard, { borderRadius: rs(32, 0.86, 1), padding: rs(28, 0.84, 1), marginBottom: rv(20, 0.78, 1) }]}>
                    <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
                    <Text style={[styles.title, { fontSize: rfs(34, 0.84, 1) }]}>{copy.title}</Text>
                    <Text style={[styles.body, { fontSize: rfs(16, 0.9, 1), lineHeight: Math.round(rfs(16, 0.9, 1) * 1.5), marginBottom: rv(20, 0.78, 1) }]}>{copy.body}</Text>

                    <View style={styles.bullets}>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={[styles.bulletText, { fontSize: rfs(15, 0.9, 1) }]}>Unlimited unlocked jobs</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={[styles.bulletText, { fontSize: rfs(15, 0.9, 1) }]}>Receipt scan, expenses, and weekly history</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <MaterialIcons name="check-circle" size={18} color={colors.primarySoft} />
                            <Text style={[styles.bulletText, { fontSize: rfs(15, 0.9, 1) }]}>Weekly goals and premium dashboard cards</Text>
                        </View>
                    </View>
                </View>

                {user?.subscription.isPremium ? (
                    <View style={[styles.activeCard, { borderRadius: rs(28, 0.86, 1), padding: rs(22, 0.84, 1), marginBottom: rv(18, 0.78, 1) }]}>
                        <Text style={styles.activeLabel}>Current plan</Text>
                        <Text style={[styles.activeValue, { fontSize: rfs(28, 0.86, 1) }]}>
                            {user.subscription.planTerm === 'annual'
                                ? 'Yearly'
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

                <View style={[styles.planStack, { gap: rv(14, 0.78, 1), marginBottom: rv(18, 0.78, 1) }]}>
                    {packages.map((pkg) => {
                        const kind = getPlanKind(pkg.identifier);
                        const support = getPlanSupportCopy(pkg.identifier);
                        const isBestOffer = kind === 'six_month';

                        return (
                            <TouchableOpacity
                                key={pkg.identifier}
                                activeOpacity={0.88}
                                style={[
                                    styles.planCard,
                                    { borderRadius: rs(28, 0.86, 1), padding: rs(22, 0.84, 1) },
                                    isBestOffer && styles.planCardFeatured,
                                ]}
                                disabled={isPurchasing}
                                onPress={() => handlePurchase(pkg)}
                            >
                                <View style={styles.planHeader}>
                                    <View style={styles.planHeaderCopy}>
                                        <Text style={[styles.planTitle, { fontSize: rfs(24, 0.86, 1) }]}>{getPlanLabel(pkg.identifier)}</Text>
                                        <Text style={[styles.planSubtitle, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.42) }]}>
                                            {support.eyebrow}
                                        </Text>
                                    </View>
                                    {isBestOffer ? (
                                        <View style={styles.featuredPill}>
                                            <Text style={styles.featuredPillText}>Best Offer</Text>
                                        </View>
                                    ) : null}
                                </View>

                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceText, { fontSize: rfs(22, 0.86, 1) }]}>{pkg.product.priceString}</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
                                </View>

                                <View style={styles.planBenefits}>
                                    {support.benefits.map((benefit) => (
                                        <View key={`${pkg.identifier}-${benefit}`} style={styles.planBenefitRow}>
                                            <MaterialIcons name="check-circle" size={16} color={isBestOffer ? '#ff8a00' : colors.primary} />
                                            <Text style={[styles.planBenefitText, { fontSize: rfs(13, 0.92, 1), lineHeight: Math.round(rfs(13, 0.92, 1) * 1.4) }]}>
                                                {benefit}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.secondaryButton, isPurchasing && styles.secondaryButtonDisabled]}
                    activeOpacity={0.84}
                    onPress={handleRestore}
                    disabled={isPurchasing}
                >
                    <Text style={styles.secondaryButtonText}>Restore purchases</Text>
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {isLoading ? <Text style={styles.helperText}>Loading offers...</Text> : null}
                {isPurchasing ? <Text style={styles.helperText}>Waiting for the store...</Text> : null}
                {!isLoading && packages.length === 0 ? (
                    <Text style={styles.helperText}>
                        Subscriptions are temporarily unavailable. Please try again later.
                    </Text>
                ) : null}

                <Text style={styles.legalText}>
                    Purchases renew automatically unless cancelled before the renewal date. By subscribing, you agree to the Apple Standard EULA and Privacy Policy.
                </Text>

                <View style={styles.linksRow}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(config.TERMS_URL)}>
                        <Text style={styles.linkText}>Apple Standard EULA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(config.PRIVACY_URL)}>
                        <Text style={styles.linkText}>Privacy</Text>
                    </TouchableOpacity>
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
        borderWidth: 1,
        borderColor: colors.outlineVariant,
    },
    planCardFeatured: {
        borderWidth: 2,
        borderColor: '#ff8a00',
        backgroundColor: '#fff9f1',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    planHeaderCopy: {
        flex: 1,
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
        marginBottom: 16,
    },
    priceText: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: '800',
    },
    planBenefits: {
        gap: 10,
    },
    planBenefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    planBenefitText: {
        flex: 1,
        color: colors.onSurfaceVariant,
        fontSize: 13,
        fontWeight: '600',
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
});
