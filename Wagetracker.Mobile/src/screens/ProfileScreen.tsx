import React, { useCallback } from 'react';
import {
    Linking,
    Platform,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useJobsStore, useSubscriptionStore } from '../stores';
import { config } from '../config';
import { colors, fontSizes, fontWeights, spacing, useResponsiveLayout } from '../theme';

type ProfileNavigationProp = any;

const menuItems = [
    { key: 'personal', label: 'Personal Info', icon: 'person' },
    { key: 'payments', label: 'Payment Methods', icon: 'account-balance-wallet' },
    { key: 'settings', label: 'App Settings', icon: 'tune' },
    { key: 'support', label: 'Help & Support', icon: 'help-outline' },
] as const;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuthStore();
    const { summary, fetchDashboard } = useJobsStore();
    const { restorePurchases } = useSubscriptionStore();
    const { isCompact, horizontalPadding, rs } = useResponsiveLayout();
    const [refreshing, setRefreshing] = React.useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard])
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

    const handleMenuPress = (label: string) => {
        Toast.show({
            type: 'info',
            text1: label,
            text2: 'This section is not wired yet.',
            visibilityTime: 1800,
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
        await Linking.openURL(url);
    };

    const formatCurrency = (amount: number | undefined) =>
        `$${(amount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;

    const initials = (user?.fullName || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

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

                <TouchableOpacity
                    style={[styles.headerIconButton, { width: rs(42), height: rs(42), borderRadius: rs(21) }]}
                    onPress={() => handleMenuPress('Settings')}
                    activeOpacity={0.85}
                >
                    <Feather name="settings" size={20} color={colors.primary} />
                </TouchableOpacity>
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

                    <TouchableOpacity
                        style={[styles.editAvatarButton, { width: rs(58), height: rs(58), borderRadius: rs(29) }]}
                        onPress={() => handleMenuPress('Profile photo')}
                        activeOpacity={0.88}
                    >
                        <MaterialIcons name="photo-camera" size={22} color={colors.onSurface} />
                    </TouchableOpacity>

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

                <View style={[styles.subscriptionCard, { borderRadius: rs(30), padding: rs(24) }]}>
                    <View style={styles.subscriptionHeader}>
                        <View>
                            <Text style={styles.subscriptionEyebrow}>Subscription</Text>
                            <Text style={[styles.subscriptionTitle, { fontSize: isCompact ? 24 : 28 }]}>
                                {user?.subscription.isPremium
                                    ? user.subscription.planTerm === 'annual'
                                        ? '12 Month Premium'
                                        : user.subscription.planTerm === 'six_month'
                                            ? '6 Month Premium'
                                            : 'Monthly Premium'
                                    : 'Free Tier'}
                            </Text>
                        </View>
                        <MaterialIcons
                            name={user?.subscription.isPremium ? 'workspace-premium' : 'lock-outline'}
                            size={26}
                            color={user?.subscription.isPremium ? '#ff8a00' : colors.primary}
                        />
                    </View>

                    <Text style={styles.subscriptionCopy}>
                        {user?.subscription.isPremium
                            ? `Status: ${user.subscription.status.replace('_', ' ')}`
                            : 'Upgrade for goals, expenses, and unlimited unlocked jobs.'}
                    </Text>

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
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.menuRow, { paddingHorizontal: rs(22), paddingVertical: rs(20) }]}
                            onPress={() => handleMenuPress(item.label)}
                            activeOpacity={0.82}
                        >
                            <View style={[styles.menuIconBubble, { width: rs(52), height: rs(52), borderRadius: rs(26) }]}> 
                                <MaterialIcons name={item.icon} size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { fontSize: isCompact ? 18 : 20 }]}>{item.label}</Text>
                            <Feather name="chevron-right" size={22} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
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
    editAvatarButton: {
        marginTop: -spacing.lg,
        marginLeft: 118,
        backgroundColor: colors.secondaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 6,
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
});
