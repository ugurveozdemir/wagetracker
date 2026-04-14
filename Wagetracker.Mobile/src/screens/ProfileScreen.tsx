import React, { useCallback } from 'react';
import {
    Alert,
    Linking,
    Platform,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useJobsStore, useSubscriptionStore } from '../stores';
import { config } from '../config';
import { colors, fontSizes, fontWeights, spacing, useResponsiveLayout } from '../theme';

const menuItems = [
    { key: 'personal', label: 'Personal Info', icon: 'person' },
    { key: 'support', label: 'Help & Support', icon: 'help-outline' },
] as const;

type ProfileMenuKey = typeof menuItems[number]['key'];

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout, deleteAccount } = useAuthStore();
    const { summary, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const { restorePurchases, presentCustomerCenter } = useSubscriptionStore();
    const { isCompact, horizontalPadding, rs } = useResponsiveLayout();
    const [refreshing, setRefreshing] = React.useState(false);
    const [expandedSection, setExpandedSection] = React.useState<ProfileMenuKey | null>('personal');

    useFocusEffect(
        useCallback(() => {
            fetchDashboard({ silent: hasLoadedDashboard });
        }, [fetchDashboard, hasLoadedDashboard])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboard();
        setRefreshing(false);
    }, [fetchDashboard]);

    const handleLogout = async () => {
        await logout();
        Toast.show({
            type: 'info',
            text1: 'Signed Out',
            text2: 'See you next time.',
            visibilityTime: 2000,
        });
    };

    const handleRestore = async () => {
        try {
            const updatedUser = await restorePurchases();
            Toast.show({
                type: updatedUser?.subscription.isPremium ? 'success' : 'info',
                text1: updatedUser?.subscription.isPremium ? 'Purchases Restored' : 'No Active Subscription',
                text2: updatedUser?.subscription.isPremium
                    ? 'Premium access is active on this account.'
                    : 'No active subscription was found.',
                visibilityTime: 2200,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Restore Failed',
                text2: error instanceof Error ? error.message : 'Please try again.',
                visibilityTime: 2600,
            });
        }
    };

    const handleManageSubscription = async () => {
        const url = Platform.OS === 'ios'
            ? config.APP_STORE_SUBSCRIPTIONS_URL
            : config.PLAY_STORE_SUBSCRIPTIONS_URL;
        try {
            await presentCustomerCenter();
        } catch (error) {
            Toast.show({
                type: 'info',
                text1: 'Opening Store Settings',
                text2: error instanceof Error ? error.message : 'Manage your subscription in the store.',
                visibilityTime: 2600,
            });
            await Linking.openURL(url);
        }
    };

    const handleSupportEmail = async () => {
        try {
            await Linking.openURL(`mailto:${config.SUPPORT_EMAIL}?subject=${encodeURIComponent('Chickaree support')}`);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Email Unavailable',
                text2: `Please email ${config.SUPPORT_EMAIL} directly.`,
                visibilityTime: 2200,
            });
        }
    };

    const openUrl = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Link Unavailable',
                text2: 'Please try again later.',
                visibilityTime: 2200,
            });
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This permanently deletes your Chickaree account, jobs, entries, expenses, and profile data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            Toast.show({
                                type: 'success',
                                text1: 'Account Deleted',
                                text2: 'Your Chickaree account has been removed.',
                                visibilityTime: 2400,
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Deletion Failed',
                                text2: error instanceof Error ? error.message : 'Please try again.',
                                visibilityTime: 2800,
                            });
                        }
                    },
                },
            ]
        );
    };

    const toggleSection = (key: ProfileMenuKey) => {
        setExpandedSection((current) => (current === key ? null : key));
    };

    const formatCurrency = (amount: number | undefined) =>
        `$${(amount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;

    const formatDate = (date: string | null | undefined) => {
        if (!date) {
            return 'Not set';
        }

        return new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const initials = (user?.fullName || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    const subscriptionTitle = user?.subscription.isPremium
        ? user.subscription.planTerm === 'annual'
            ? '12 Month Premium'
            : user.subscription.planTerm === 'six_month'
                ? '6 Month Premium'
                : 'Monthly Premium'
        : 'Free Tier';

    const subscriptionStatus = user?.subscription.status
        ? user.subscription.status.replace('_', ' ')
        : 'inactive';

    const weeklyGoalAmount = user?.weeklyGoalAmount ?? summary?.weeklyGoal?.targetAmount;
    const unlockedJobs = user?.access.unlockedJobCount ?? 0;
    const maxUnlockedJobs = user?.access.maxUnlockedJobs ?? 0;

    const renderInfoRow = (label: string, value: string) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );

    const renderSectionContent = (key: ProfileMenuKey) => {
        if (key === 'personal') {
            return (
                <View style={styles.detailPanel}>
                    {renderInfoRow('Full name', user?.fullName || 'Account')}
                    {renderInfoRow('Email', user?.email || 'No email available')}
                    {renderInfoRow('Weekly goal', weeklyGoalAmount != null ? formatCurrency(weeklyGoalAmount) : 'Not set')}
                    {renderInfoRow('Active jobs', `${summary?.activeJobsCount ?? 0}`)}
                    {renderInfoRow('Plan', subscriptionTitle)}
                </View>
            );
        }

        return (
            <View style={styles.detailPanel}>
                <Text style={styles.supportCopy}>
                    Need help with your account, subscription, or wage entries? Send an email and include the device you use.
                </Text>
                <TouchableOpacity style={styles.supportEmailRow} onPress={handleSupportEmail} activeOpacity={0.82}>
                    <Feather name="mail" size={18} color={colors.primary} />
                    <Text style={styles.supportEmail}>{config.SUPPORT_EMAIL}</Text>
                </TouchableOpacity>
                <View style={styles.supportLinkRow}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => openUrl(config.TERMS_URL)}>
                        <Text style={styles.supportLink}>Terms</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => openUrl(config.PRIVACY_URL)}>
                        <Text style={styles.supportLink}>Privacy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => openUrl(config.ACCOUNT_DELETION_URL)}>
                        <Text style={styles.supportLink}>Delete account page</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.deleteInlineButton} onPress={handleDeleteAccount} activeOpacity={0.82}>
                    <Feather name="trash-2" size={18} color={colors.danger} />
                    <Text style={styles.deleteInlineText}>Delete account in app</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (isLoading && !hasLoadedDashboard) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: rs(8) }]}>
                <TouchableOpacity
                    style={[styles.headerIconButton, { width: rs(42), height: rs(42), borderRadius: rs(21) }]}
                    onPress={() => navigation.navigate('HomeTab')}
                    activeOpacity={0.85}
                >
                    <Feather name="arrow-left" size={22} color={colors.primary} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { fontSize: isCompact ? 19 : 22 }]}>Profile</Text>

                <View style={{ width: rs(42), height: rs(42) }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: rs(18),
                    paddingBottom: rs(156),
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.heroSection}>
                    <View style={[styles.avatarShell, { width: rs(172), height: rs(172), borderRadius: rs(52) }]}>
                        <View style={[styles.avatarCore, { borderRadius: rs(44) }]}>
                            <Text style={[styles.avatarText, { fontSize: isCompact ? 46 : 52 }]}>{initials}</Text>
                        </View>
                    </View>

                    <Text style={[styles.userName, { fontSize: isCompact ? 32 : 36 }]}>{user?.fullName || 'Account'}</Text>
                    <View style={styles.locationRow}>
                        <Feather name="mail" size={16} color={colors.onSurfaceVariant} />
                        <Text style={styles.locationText}>{user?.email || 'No email available'}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, styles.statCardPrimary, { borderRadius: rs(30), padding: rs(24) }]}>
                        <View style={styles.statIconWrap}>
                            <MaterialIcons name="payments" size={24} color={colors.emeraldLight} />
                        </View>
                        <Text style={[styles.statLabel, styles.statLabelPrimary]}>Total Earned</Text>
                        <Text style={[styles.statValue, styles.statValuePrimary, { fontSize: isCompact ? 24 : 28 }]}>
                            {formatCurrency(summary?.totalEarnings)}
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardSecondary, { borderRadius: rs(30), padding: rs(24) }]}>
                        <View style={styles.statIconWrap}>
                            <MaterialIcons name="savings" size={24} color="#5a2400" />
                        </View>
                        <Text style={styles.statLabel}>Weekly Net</Text>
                        <Text style={[styles.statValue, { fontSize: isCompact ? 24 : 28 }]}>{formatCurrency(summary?.weeklyNet)}</Text>
                    </View>
                </View>

                <View style={[styles.subscriptionCard, { borderRadius: rs(30), padding: rs(isCompact ? 24 : 28) }]}>
                    <View style={styles.subscriptionHeader}>
                        <View>
                            <Text style={styles.subscriptionEyebrow}>Subscription</Text>
                            <Text style={[styles.subscriptionTitle, { fontSize: isCompact ? 24 : 28 }]}>
                                {subscriptionTitle}
                            </Text>
                        </View>
                        <MaterialIcons
                            name={user?.subscription.isPremium ? 'workspace-premium' : 'lock-outline'}
                            size={34}
                            color={user?.subscription.isPremium ? '#ff8a00' : colors.primary}
                        />
                    </View>

                    <Text style={styles.subscriptionCopy}>
                        {user?.subscription.isPremium
                            ? `Status: ${user.subscription.status.replace('_', ' ')}`
                            : 'Upgrade for goals, expenses, and unlimited unlocked jobs.'}
                    </Text>

                    <View style={styles.subscriptionMetaGrid}>
                        <View style={styles.subscriptionMetaItem}>
                            <Text style={styles.subscriptionMetaLabel}>Status</Text>
                            <Text style={styles.subscriptionMetaValue}>{subscriptionStatus}</Text>
                        </View>
                        <View style={styles.subscriptionMetaItem}>
                            <Text style={styles.subscriptionMetaLabel}>Renews</Text>
                            <Text style={styles.subscriptionMetaValue}>
                                {user?.subscription.willRenew ? 'On' : 'Off'}
                            </Text>
                        </View>
                        <View style={styles.subscriptionMetaItem}>
                            <Text style={styles.subscriptionMetaLabel}>Expires</Text>
                            <Text style={styles.subscriptionMetaValue}>{formatDate(user?.subscription.expiresAt)}</Text>
                        </View>
                        <View style={styles.subscriptionMetaItem}>
                            <Text style={styles.subscriptionMetaLabel}>Jobs</Text>
                            <Text style={styles.subscriptionMetaValue}>
                                {user?.subscription.isPremium ? 'Unlimited' : `${unlockedJobs}/${maxUnlockedJobs}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.subscriptionActions}>
                        <TouchableOpacity
                            style={styles.subscriptionButtonPrimary}
                            activeOpacity={0.86}
                            onPress={() => {
                                if (user?.subscription.isPremium) {
                                    handleManageSubscription();
                                    return;
                                }

                                navigation.navigate('Paywall', { source: 'profile', feature: 'premium' });
                            }}
                        >
                            <Text style={styles.subscriptionButtonPrimaryText}>
                                {user?.subscription.isPremium ? 'Manage' : 'Upgrade'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.subscriptionButtonSecondary} activeOpacity={0.86} onPress={handleRestore}>
                            <Text style={styles.subscriptionButtonSecondaryText}>Restore</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.menuPanel, { borderRadius: rs(32), paddingVertical: rs(10) }]}>
                    {menuItems.map((item) => (
                        <View key={item.key}>
                            <TouchableOpacity
                                style={[styles.menuRow, { paddingHorizontal: rs(22), paddingVertical: rs(20) }]}
                                onPress={() => toggleSection(item.key)}
                                activeOpacity={0.82}
                            >
                                <View style={[styles.menuIconBubble, { width: rs(52), height: rs(52), borderRadius: rs(26) }]}>
                                    <MaterialIcons name={item.icon} size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.menuLabel, { fontSize: isCompact ? 18 : 20 }]}>{item.label}</Text>
                                <Feather
                                    name={expandedSection === item.key ? 'chevron-up' : 'chevron-down'}
                                    size={22}
                                    color={colors.onSurfaceVariant}
                                />
                            </TouchableOpacity>
                            {expandedSection === item.key ? renderSectionContent(item.key) : null}
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.logoutCard, { borderRadius: rs(30), paddingHorizontal: rs(24), paddingVertical: rs(22) }]}
                    onPress={handleLogout}
                    activeOpacity={0.86}
                >
                    <View style={[styles.logoutIconBubble, { width: rs(48), height: rs(48), borderRadius: rs(24) }]}>
                        <Feather name="log-out" size={20} color={colors.danger} />
                    </View>
                    <Text style={[styles.logoutText, { fontSize: isCompact ? 18 : 20 }]}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceBright,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerIconButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    avatarShell: {
        backgroundColor: colors.surfaceContainerLow,
        padding: spacing.sm,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 5,
    },
    avatarCore: {
        flex: 1,
        backgroundColor: colors.slate700,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.onPrimary,
        fontWeight: fontWeights.extrabold,
    },
    userName: {
        color: colors.onSurface,
        fontWeight: fontWeights.extrabold,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    locationText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.medium,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing['2xl'],
    },
    statCard: {
        flex: 1,
        minHeight: 186,
        justifyContent: 'space-between',
    },
    statCardPrimary: {
        backgroundColor: colors.primaryLight,
    },
    statCardSecondary: {
        backgroundColor: colors.secondaryContainer,
    },
    statIconWrap: {
        marginBottom: spacing.xl,
    },
    statLabel: {
        color: 'rgba(24, 29, 25, 0.82)',
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.medium,
        marginTop: 'auto',
        marginBottom: spacing.xs,
    },
    statLabelPrimary: {
        color: 'rgba(156, 245, 193, 0.9)',
    },
    statValue: {
        color: '#4c1700',
        fontWeight: fontWeights.extrabold,
    },
    statValuePrimary: {
        color: colors.primarySoft,
    },
    menuPanel: {
        backgroundColor: colors.surfaceLow,
        marginBottom: spacing.xl,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    menuIconBubble: {
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        flex: 1,
        color: colors.onSurface,
        fontWeight: fontWeights.bold,
    },
    logoutCard: {
        backgroundColor: colors.surfaceContainerLowest,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
        elevation: 4,
    },
    logoutIconBubble: {
        backgroundColor: '#fff5f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        color: colors.danger,
        fontWeight: fontWeights.bold,
    },
    subscriptionCard: {
        backgroundColor: colors.surfaceContainerLowest,
        marginBottom: spacing.xl,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    subscriptionEyebrow: {
        color: colors.primary,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.xs,
    },
    subscriptionTitle: {
        color: colors.onSurface,
        fontWeight: fontWeights.extrabold,
    },
    subscriptionCopy: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    subscriptionMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    subscriptionMetaItem: {
        width: '47%',
        minHeight: 72,
        borderRadius: 18,
        backgroundColor: colors.surfaceLow,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        justifyContent: 'center',
    },
    subscriptionMetaLabel: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    subscriptionMetaValue: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        textTransform: 'capitalize',
    },
    subscriptionActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    subscriptionButtonPrimary: {
        flex: 1,
        minHeight: 52,
        borderRadius: 999,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscriptionButtonPrimaryText: {
        color: colors.white,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    subscriptionButtonSecondary: {
        flex: 1,
        minHeight: 52,
        borderRadius: 999,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscriptionButtonSecondaryText: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    detailPanel: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: 22,
        backgroundColor: colors.surfaceContainerLowest,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    detailLabel: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
    },
    detailValue: {
        flex: 1,
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        textAlign: 'right',
    },
    supportCopy: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    supportEmailRow: {
        minHeight: 48,
        borderRadius: 18,
        backgroundColor: colors.surfaceContainerHigh,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    supportEmail: {
        color: colors.primary,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    supportLinkRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    supportLink: {
        color: colors.primary,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    deleteInlineButton: {
        minHeight: 48,
        borderRadius: 18,
        backgroundColor: colors.dangerBg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    deleteInlineText: {
        color: colors.danger,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
});
