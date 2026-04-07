import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { MainStackParamList } from '../types';
import { useJobsStore, useAuthStore } from '../stores';
import { Card } from '../components/ui';
import { JobCard } from '../components/JobCard';
import { CreateJobModal } from '../components/CreateJobModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

type DashboardNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<DashboardNavigationProp>();
    const { summary, jobs, isLoading, error, fetchDashboard } = useJobsStore();
    const { user, logout } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        setShowProfileMenu(false);
        await logout();
        Toast.show({
            type: 'info',
            text1: 'Signed Out',
            text2: 'See you next time.',
            visibilityTime: 2000,
        });
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const firstName = user?.fullName?.split(' ')[0] || 'there';

    const weeklyBars = (() => {
        const weeklyTotal = summary?.weeklyEarnings || 0;
        if (!weeklyTotal) {
            return [18, 28, 22, 36, 30, 42, 12];
        }
        return [24, 40, 32, 58, 46, 72, 18];
    })();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topBar}>
                    <View style={styles.brandWrap}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.brand}>WageTracker</Text>
                            <Text style={styles.subtitle}>Organic editorial ledger</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.currencyPill}
                        onPress={() => setShowProfileMenu(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.currencyText}>USD ($)</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCopy}>
                    <Text style={styles.heroEyebrow}>Weekly Earnings</Text>
                    <Text style={styles.heroGreeting}>Hi, {firstName}.</Text>
                    <Text style={styles.heroSubcopy}>
                        Track shifts, expenses, and momentum without changing the app logic.
                    </Text>
                </View>

                <Card style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Total Earnings This Week</Text>
                    <Text style={styles.heroValue}>{formatCurrency(summary?.weeklyEarnings || 0)}</Text>
                    <View style={styles.heroMetaRow}>
                        <View style={styles.heroMetaPill}>
                            <Text style={styles.heroMetaTitle}>Day</Text>
                            <Text style={styles.heroMetaValue}>
                                {dayName} · {dateStr}
                            </Text>
                        </View>
                        <View style={styles.heroMetaPill}>
                            <Text style={styles.heroMetaTitle}>Hours</Text>
                            <Text style={styles.heroMetaValue}>
                                {(summary?.weeklyHours || 0).toFixed(1)}h
                            </Text>
                        </View>
                    </View>
                    <View style={styles.chartRow}>
                        {weeklyBars.map((height, index) => (
                            <View key={index} style={styles.chartTrack}>
                                <View
                                    style={[
                                        styles.chartBar,
                                        {
                                            height,
                                            opacity: index === 5 ? 1 : 0.28 + index * 0.08,
                                        },
                                    ]}
                                />
                            </View>
                        ))}
                    </View>
                    <View style={styles.chartLabels}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                            <Text key={`${label}-${index}`} style={styles.chartLabel}>
                                {label}
                            </Text>
                        ))}
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Gigs</Text>
                    <Text style={styles.sectionMeta}>{jobs.length} Active</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.jobsScroller}
                >
                    {jobs.map((job) => (
                        <View key={job.id} style={styles.jobCardWrap}>
                            <JobCard
                                job={job}
                                onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                                style={styles.jobCard}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addGigCard}
                        onPress={() => setIsModalOpen(true)}
                        activeOpacity={0.84}
                    >
                        <View style={styles.addGigIcon}>
                            <Feather name="plus" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.addGigTitle}>Add Gig</Text>
                        <Text style={styles.addGigText}>Create a new role without leaving the dashboard.</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <Text style={styles.sectionMeta}>Live summary</Text>
                </View>

                <View style={styles.activityList}>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(0, 109, 68, 0.10)' }]}>
                            <Feather name="trending-up" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.activityCopy}>
                            <Text style={styles.activityTitle}>Weekly net</Text>
                            <Text style={styles.activityMeta}>Earnings minus expenses</Text>
                        </View>
                        <Text style={styles.activityAmount}>
                            {formatCurrency(summary?.weeklyNet || 0)}
                        </Text>
                    </View>

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(254, 94, 30, 0.10)' }]}>
                            <Feather name="credit-card" size={18} color={colors.secondaryContainer} />
                        </View>
                        <View style={styles.activityCopy}>
                            <Text style={styles.activityTitle}>Expenses this week</Text>
                            <Text style={styles.activityMeta}>Current period spend</Text>
                        </View>
                        <Text style={[styles.activityAmount, styles.expenseAmount]}>
                            -{formatCurrency(summary?.weeklyExpenses || 0).replace('$', '$')}
                        </Text>
                    </View>

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(0, 82, 50, 0.10)' }]}>
                            <Feather name="briefcase" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.activityCopy}>
                            <Text style={styles.activityTitle}>Active jobs</Text>
                            <Text style={styles.activityMeta}>All-time tracked roles</Text>
                        </View>
                        <Text style={styles.activityAmount}>{summary?.activeJobsCount || 0}</Text>
                    </View>
                </View>

                {error && !isLoading ? (
                    <View style={styles.errorBanner}>
                        <Feather name="wifi-off" size={16} color={colors.secondaryContainer} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <CreateJobModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={() => {
                    setIsModalOpen(false);
                    fetchDashboard();
                }}
            />

            <Modal
                visible={showProfileMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
            >
                <Pressable style={styles.menuOverlay} onPress={() => setShowProfileMenu(false)}>
                    <Pressable style={styles.menuContainer}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowProfileMenu(false);
                                (navigation as any).navigate('ProfileTab');
                            }}
                        >
                            <Feather name="user" size={18} color={colors.primary} />
                            <Text style={styles.menuItemText}>Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                            <Feather name="log-out" size={18} color={colors.secondaryContainer} />
                            <Text style={[styles.menuItemText, styles.menuDangerText]}>Sign Out</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
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
    contentContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: 120,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    brandWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceContainer,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
    brand: {
        color: colors.primary,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
    },
    subtitle: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
    },
    currencyPill: {
        backgroundColor: colors.surfaceContainerLow,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
    },
    currencyText: {
        color: colors.primary,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    heroCopy: {
        marginBottom: spacing.xl,
    },
    heroEyebrow: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginBottom: spacing.sm,
    },
    heroGreeting: {
        color: colors.primary,
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.sm,
    },
    heroSubcopy: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
        maxWidth: 320,
    },
    heroCard: {
        marginBottom: spacing['3xl'],
        padding: spacing['3xl'],
    },
    heroLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
    },
    heroValue: {
        color: colors.primary,
        fontSize: 46,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.lg,
    },
    heroMetaRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    heroMetaPill: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    heroMetaTitle: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    heroMetaValue: {
        color: colors.onSurface,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    chartRow: {
        height: 110,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    chartTrack: {
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '100%',
        backgroundColor: colors.primary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    chartLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        color: colors.onSurface,
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
    },
    sectionMeta: {
        color: colors.primary,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    jobsScroller: {
        paddingBottom: spacing.sm,
        paddingRight: spacing.md,
    },
    jobCardWrap: {
        width: 300,
        marginRight: spacing.md,
    },
    jobCard: {
        marginBottom: 0,
        minHeight: 180,
    },
    addGigCard: {
        width: 220,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        justifyContent: 'center',
    },
    addGigIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.surfaceContainerLowest,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    addGigTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.sm,
    },
    addGigText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        lineHeight: 20,
    },
    activityList: {
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
    },
    activityIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    activityCopy: {
        flex: 1,
    },
    activityTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        marginBottom: 2,
    },
    activityMeta: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
    },
    activityAmount: {
        color: colors.primary,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
    },
    expenseAmount: {
        color: colors.secondaryContainer,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(254, 94, 30, 0.08)',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    errorText: {
        color: colors.secondaryContainer,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
        flex: 1,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(24, 29, 25, 0.18)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 86,
        paddingRight: spacing.lg,
    },
    menuContainer: {
        backgroundColor: 'rgba(255,255,255,0.84)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
        minWidth: 180,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    menuItemText: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
    },
    menuDangerText: {
        color: colors.secondaryContainer,
    },
});
