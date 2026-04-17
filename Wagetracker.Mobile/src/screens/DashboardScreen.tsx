import React, { useCallback, useState } from 'react';
import {
    Image,
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { HomeStackParamList, RootStackParamList, TabParamList } from '../types';
import { useAuthStore, useJobsStore } from '../stores';
import { CreateJobModal } from '../components/CreateJobModal';
import { LockedFeatureCard, LockedFeatureModal } from '../components/LockedFeaturePreview';
import { colors } from '../theme';

type DashboardNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<TabParamList>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

type PaywallTarget = RootStackParamList['Paywall'];

const emptyChartPoints = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayLabel, index) => ({
    date: `placeholder-${index}`,
    dayLabel,
    totalEarnings: 0,
}));

const dayLabelsByIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const brandLogo = require('../../assets/logo.png');

const gigCardThemes = [
    { backgroundStyle: 'gigCardPrimary', icon: 'hotel' },
    { backgroundStyle: 'gigCardTertiary', icon: 'restaurant' },
    { backgroundStyle: 'gigCardTeal', icon: 'cleaning-services' },
    { backgroundStyle: 'gigCardSlate', icon: 'work' },
] as const;

export const DashboardScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const navigation = useNavigation<DashboardNavigationProp>();
    const { user } = useAuthStore();
    const { summary, jobs, error, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showJobLimitLocked, setShowJobLimitLocked] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedChartPoint, setSelectedChartPoint] = useState<string | null>(null);
    const scale = Math.min(Math.max(width / 393, 0.84), 1);
    const isCompact = width < 380;
    const heroPadding = 32 * scale;
    const sectionTitleSize = isCompact ? 24 : 28;
    const heroValueSize = isCompact ? 40 : 48;
    const heroValueLineHeight = isCompact ? 46 : 56;
    const brandFontSize = 20;
    const gigCardWidth = Math.min(Math.max(width - 104, 228), 264);
    const addGigCardWidth = Math.min(Math.max(width - 176, 168), 188);
    const horizontalPadding = isCompact ? 18 : 24;
    const chartPoints = summary?.dailyEarningsSinceMonday?.length
        ? summary.dailyEarningsSinceMonday
        : emptyChartPoints;
    const maxChartValue = Math.max(...chartPoints.map((point) => point.totalEarnings), 0);
    const todayDayLabel = dayLabelsByIndex[new Date().getDay()];

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

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    const formatShortDate = (value: string) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };
    const goalProgressPercent = summary?.weeklyGoal?.targetAmount != null
        ? Math.max(0, Math.min(summary?.weeklyGoal?.progressPercent ?? 0, 100))
        : 0;
    const goalMotivationQuote = summary?.weeklyGoal?.motivationQuote?.trim() ?? '';
    const canUseExpenses = Boolean(user?.access.canUseExpenses);
    const recentExpensesPreview = (summary?.recentExpenses ?? []).slice(0, 3);
    const weeklyNet = summary?.weeklyNet ?? 0;
    const weeklyNetLabel = `${weeklyNet >= 0 ? '+' : '-'}${formatCurrency(Math.abs(weeklyNet))}`;
    const openPremiumPaywall = (target: PaywallTarget) => {
        navigation.navigate('Paywall', target);
    };
    const openExpensesDetails = () => {
        if (canUseExpenses) {
            navigation.navigate('ExpensesTab');
            return;
        }

        openPremiumPaywall({ source: 'dashboard', feature: 'expenses' });
    };
    const openGoalsPaywall = () => openPremiumPaywall({ source: 'goals', feature: 'goals' });
    const openJobLimitPaywall = () => {
        setShowJobLimitLocked(false);
        openPremiumPaywall({ source: 'job_limit', feature: 'jobs' });
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
            <StatusBar barStyle="dark-content" backgroundColor="#fbf9f1" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: 16,
                    paddingBottom: isCompact ? 164 : 180,
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.brandBlock}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ProfileTab')}
                    >
                        <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
                        <Text
                            style={[
                                styles.brandText,
                                {
                                    fontSize: brandFontSize,
                                    lineHeight: brandFontSize + 2,
                                    transform: [{ translateY: 4 * scale }],
                                },
                            ]}
                        >
                            Chickaree
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={[
                        styles.heroCard,
                        {
                            padding: heroPadding,
                            marginBottom: 32 * scale,
                            borderRadius: 32 * scale,
                        },
                    ]}
                >
                    <View style={[styles.heroIconGhost, { padding: heroPadding }]}>
                        <MaterialIcons name="trending-up" size={120 * scale} color={colors.primary} />
                    </View>

                    <View style={styles.heroInner}>
                        <Text style={styles.heroLabel}>Total Earnings Since Monday</Text>
                        <Text
                            style={[
                                styles.heroValue,
                                {
                                    fontSize: heroValueSize,
                                    lineHeight: heroValueLineHeight,
                                },
                            ]}
                        >
                            {formatCurrency(summary?.weeklyEarnings ?? 0)}
                        </Text>

                        <View style={styles.chartRow}>
                            {chartPoints.map((point, index) => {
                                const barHeight = maxChartValue > 0
                                    ? Math.max((point.totalEarnings / maxChartValue) * 100, point.totalEarnings > 0 ? 10 : 4)
                                    : 4;
                                const isSelected = selectedChartPoint === point.date;
                                const isToday = point.dayLabel === todayDayLabel;
                                const backgroundColor =
                                    isToday
                                        ? colors.primary
                                        : point.totalEarnings > 0
                                          ? 'rgba(0, 109, 68, 0.20)'
                                          : index >= 5
                                            ? colors.surfaceContainerHigh
                                            : 'rgba(0, 109, 68, 0.10)';

                                return (
                                    <TouchableOpacity
                                        key={point.date}
                                        activeOpacity={0.85}
                                        style={[
                                            styles.chartBarSlot,
                                            isSelected && styles.chartBarSlotSelected,
                                        ]}
                                        onPress={() => setSelectedChartPoint((current) => current === point.date ? null : point.date)}
                                    >
                                        <View
                                            style={[
                                                styles.chartBarStack,
                                                {
                                                    height: `${barHeight}%`,
                                                },
                                            ]}
                                        >
                                            {isSelected ? (
                                                <Text style={styles.chartTooltipText}>{formatCurrency(point.totalEarnings)}</Text>
                                            ) : null}

                                            <View
                                                style={[
                                                    styles.chartBar,
                                                    {
                                                        backgroundColor,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.chartLabelsRow}>
                            {chartPoints.map((point) => (
                                <Text
                                    key={point.date}
                                    style={[
                                        styles.chartLabel,
                                        point.dayLabel === todayDayLabel && styles.chartLabelActive,
                                    ]}
                                >
                                    {point.dayLabel}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Active Jobs</Text>
                    <Text style={styles.sectionMeta}>{jobs.length} Active</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -horizontalPadding }}
                    contentContainerStyle={{
                        gap: 16 * scale,
                        paddingLeft: horizontalPadding,
                        paddingRight: horizontalPadding,
                        paddingBottom: 8,
                    }}
                >
                    {jobs.map((job, index) => {
                        const theme = gigCardThemes[index % gigCardThemes.length];
                        const backgroundStyle =
                            theme.backgroundStyle === 'gigCardPrimary'
                                ? styles.gigCardPrimary
                                : theme.backgroundStyle === 'gigCardTertiary'
                                  ? styles.gigCardTertiary
                                  : theme.backgroundStyle === 'gigCardTeal'
                                    ? styles.gigCardTeal
                                    : styles.gigCardSlate;
                        return (
                            <TouchableOpacity
                                key={job.id}
                                style={[
                                    styles.gigCard,
                                    {
                                        minWidth: gigCardWidth,
                                        height: 172 * scale,
                                        padding: 20 * scale,
                                        borderRadius: 28 * scale,
                                    },
                                    backgroundStyle,
                                ]}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                            >
                                <View style={styles.gigGlow} />

                                <View>
                                    <View style={styles.gigTopRow}>
                                        <MaterialIcons
                                            name={theme.icon}
                                            size={Math.round(32 * scale)}
                                            color={colors.white}
                                        />
                                    </View>

                                    <Text style={[styles.gigTitle, { fontSize: isCompact ? 18 : 21 }]}>{job.title}</Text>
                                    {job.isLocked ? <Text style={styles.lockedTag}>Locked</Text> : null}
                                    <Text style={[styles.gigSubtitle, { fontSize: isCompact ? 12 : 13 }]}> 
                                        First day: {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][job.firstDayOfWeek]}
                                    </Text>
                                </View>

                                <View style={styles.gigBottomRow}>
                                    <Text style={[styles.gigRate, { fontSize: isCompact ? 22 : 24 }]}>
                                        ${job.hourlyRate.toFixed(2)}
                                        <Text style={[styles.gigRateSuffix, { fontSize: isCompact ? 11 : 12 }]}>/hr</Text>
                                    </Text>

                                    <View style={styles.gigArrowWrap}>
                                        <MaterialIcons name="arrow-forward" size={15} color={colors.white} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        style={[
                            styles.addGigCard,
                            {
                                minWidth: addGigCardWidth,
                                height: 172 * scale,
                                borderRadius: 28 * scale,
                            },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (!user?.subscription.isPremium && jobs.length >= 2) {
                                setShowJobLimitLocked(true);
                                return;
                            }

                            setIsModalOpen(true);
                        }}
                    >
                        <MaterialIcons name="add-circle" size={Math.round(28 * scale)} color={colors.outline} />
                        <Text style={styles.addGigText}>{!user?.subscription.isPremium && jobs.length >= 2 ? 'Upgrade' : 'Add Job'}</Text>
                    </TouchableOpacity>
                </ScrollView>

                {canUseExpenses ? (
                    <TouchableOpacity
                        style={[
                            styles.spendingCard,
                            {
                                borderRadius: 28 * scale,
                                padding: 24 * scale,
                                minHeight: 236 * scale,
                                marginTop: 20 * scale,
                            },
                        ]}
                        activeOpacity={0.9}
                        onPress={openExpensesDetails}
                    >
                        <View style={styles.spendingCardHeader}>
                            <Text style={styles.spendingLabel}>Total Spending Since Monday</Text>
                            <View style={styles.spendingIconWrap}>
                                <MaterialIcons name="receipt-long" size={18} color="#ffffff" />
                            </View>
                        </View>
                        <View style={styles.spendingHeadlineRow}>
                            <Text style={[styles.spendingValue, { fontSize: isCompact ? 34 : 40 }]}>
                                {formatCurrency(summary?.weeklyExpenses ?? 0)}
                            </Text>
                            <View style={[
                                styles.spendingNetBadge,
                                weeklyNet >= 0 ? styles.spendingNetBadgePositive : styles.spendingNetBadgeNegative,
                            ]}
                            >
                                <Text style={styles.spendingNetLabel}>Weekly Net</Text>
                                <Text style={styles.spendingNetValue}>{weeklyNetLabel}</Text>
                            </View>
                        </View>

                        <View style={styles.spendingRecentPanel}>
                            <Text style={styles.spendingRecentTitle}>Recent Expenses</Text>
                            {recentExpensesPreview.length ? (
                                recentExpensesPreview.map((expense) => (
                                    <View key={expense.id} style={styles.spendingRecentRow}>
                                        <View style={styles.spendingRecentRowText}>
                                            <Text numberOfLines={1} style={styles.spendingRecentName}>
                                                {expense.description?.trim() || expense.categoryName}
                                            </Text>
                                            <Text style={styles.spendingRecentDate}>
                                                {formatShortDate(expense.date)}
                                            </Text>
                                        </View>
                                        <Text style={styles.spendingRecentAmount}>
                                            {formatCurrency(expense.amount)}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.spendingRecentEmpty}>
                                    <Text style={styles.spendingRecentEmptyText}>No expenses yet. Tap to add your first expense.</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <LockedFeatureCard
                        feature="expenses"
                        compact
                        scale={scale}
                        onUnlock={openExpensesDetails}
                        previewVariant="weeklyLedger"
                        style={{ marginTop: 20 * scale, marginBottom: 28, padding: 18 * scale, backgroundColor: '#ff8a00' }}
                    />
                )}

                {user?.access.canUseGoals ? (
                    <TouchableOpacity
                        style={[styles.goalCard, { borderRadius: 28 * scale, padding: 24 * scale, marginTop: 18 * scale }]}
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('Goal')}
                    >
                        <View style={styles.goalCardTop}>
                            <View>
                                <Text style={styles.goalEyebrow}>Weekly Goal</Text>
                                <Text style={[styles.goalTitle, { fontSize: isCompact ? 26 : 30 }]}>This week's goal</Text>
                            </View>
                            <View style={styles.goalIconWrap}>
                                <MaterialIcons name="track-changes" size={20} color={colors.white} />
                            </View>
                        </View>

                        <View style={styles.goalProgressRow}>
                            <View style={styles.goalProgressTrack}>
                                <View
                                    style={[
                                        styles.goalProgressFill,
                                        {
                                            width: `${goalProgressPercent}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.goalPercentText}>
                                {Math.round(goalProgressPercent)}%
                            </Text>
                        </View>

                        <View style={styles.goalMetaRow}>
                            <View>
                                <Text style={styles.goalMetaLabel}>Current</Text>
                                <Text style={styles.goalMetaValue}>{formatCurrency(summary?.weeklyGoal?.currentAmount ?? 0)}</Text>
                            </View>
                            <View>
                                <Text style={styles.goalMetaLabel}>Target</Text>
                                <Text style={styles.goalMetaValue}>
                                    {summary?.weeklyGoal?.targetAmount != null
                                        ? formatCurrency(summary.weeklyGoal.targetAmount)
                                        : 'Set a goal'}
                                </Text>
                            </View>
                            <View style={styles.goalArrowWrap}>
                                <MaterialIcons name="arrow-forward" size={16} color={colors.white} />
                            </View>
                        </View>

                        {goalMotivationQuote.length ? (
                            <View style={styles.goalQuoteWrap}>
                                <Text style={styles.goalQuoteLabel}>Motivation</Text>
                                <Text style={styles.goalQuoteText} numberOfLines={3}>
                                    "{goalMotivationQuote}"
                                </Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ) : (
                    <LockedFeatureCard
                        feature="goals"
                        compact={isCompact}
                        scale={scale}
                        onUnlock={openGoalsPaywall}
                    />
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <CreateJobModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={() => {
                    setIsModalOpen(false);
                    fetchDashboard();
                }}
            />
            <LockedFeatureModal
                visible={showJobLimitLocked}
                feature="jobs"
                onClose={() => setShowJobLimitLocked(false)}
                onUnlock={openJobLimitPaywall}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbf9f1',
    },
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    brandBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.01,
        flexShrink: 1,
    },
    brandLogo: {
        width: 32,
        height: 32,
    },
    brandText: {
        color: '#005232',
        fontWeight: '800',
        letterSpacing: 0,
        flexShrink: 1,
    },
    heroCard: {
        backgroundColor: colors.white,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
        position: 'relative',
    },
    heroIconGhost: {
        position: 'absolute',
        top: 0,
        right: 0,
        opacity: 0.1,
    },
    heroInner: {
        position: 'relative',
        zIndex: 2,
        alignItems: 'center',
    },
    heroLabel: {
        color: '#6f7a71',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 8,
    },
    heroValue: {
        color: '#005232',
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 24,
        textAlign: 'center',
    },
    chartRow: {
        width: '100%',
        height: 160,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 16,
    },
    chartBarSlot: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    chartBarSlotSelected: {
        zIndex: 2,
    },
    chartBarStack: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    chartBar: {
        width: '100%',
        flex: 1,
        borderTopLeftRadius: 9999,
        borderTopRightRadius: 9999,
    },
    chartTooltipText: {
        color: '#005232',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 4,
    },
    chartLabelsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingHorizontal: 4,
    },
    chartLabel: {
        color: '#6f7a71',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    chartLabelActive: {
        color: '#005232',
    },
    spendingCard: {
        backgroundColor: '#ff8a00',
        marginBottom: 28,
        justifyContent: 'space-between',
    },
    spendingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    spendingLabel: {
        color: 'rgba(65,33,0,0.80)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    spendingIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(65,33,0,0.24)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spendingValue: {
        color: '#412100',
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    spendingHeadlineRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 18,
    },
    spendingNetBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 110,
        alignItems: 'flex-end',
    },
    spendingNetBadgePositive: {
        backgroundColor: 'rgba(0, 82, 50, 0.16)',
    },
    spendingNetBadgeNegative: {
        backgroundColor: 'rgba(186, 26, 26, 0.18)',
    },
    spendingNetLabel: {
        color: 'rgba(65,33,0,0.76)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    spendingNetValue: {
        color: '#412100',
        fontSize: 13,
        fontWeight: '800',
        marginTop: 2,
    },
    spendingRecentPanel: {
        backgroundColor: 'rgba(255, 241, 232, 0.88)',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
    },
    spendingRecentTitle: {
        color: 'rgba(65,33,0,0.72)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    spendingRecentRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 4,
    },
    spendingRecentRowText: {
        flex: 1,
        minWidth: 0,
    },
    spendingRecentName: {
        color: '#412100',
        fontSize: 14,
        fontWeight: '700',
    },
    spendingRecentDate: {
        color: 'rgba(65,33,0,0.62)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    spendingRecentAmount: {
        color: '#412100',
        fontSize: 14,
        fontWeight: '800',
    },
    spendingRecentEmpty: {
        minHeight: 42,
        justifyContent: 'center',
    },
    spendingRecentEmptyText: {
        color: 'rgba(65,33,0,0.68)',
        fontSize: 13,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#1b1c17',
        fontWeight: '700',
        letterSpacing: -0.4,
    },
    sectionMeta: {
        color: '#005232',
        fontSize: 14,
        fontWeight: '600',
    },
    gigCard: {
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 8,
    },
    gigCardPrimary: {
        backgroundColor: '#005232',
    },
    gigCardTertiary: {
        backgroundColor: '#00429B',
    },
    gigCardTeal: {
        backgroundColor: '#0d9488',
    },
    gigCardSlate: {
        backgroundColor: '#64748b',
    },
    gigGlow: {
        position: 'absolute',
        right: -16,
        top: -16,
        width: 96,
        height: 96,
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    gigTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    gigTitle: {
        color: colors.white,
        fontWeight: '700',
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    gigSubtitle: {
        color: 'rgba(255,255,255,0.80)',
    },
    gigBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    gigRate: {
        color: colors.white,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    gigRateSuffix: {
        opacity: 0.6,
    },
    gigArrowWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.20)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addGigCard: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#bec9bf',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addGigText: {
        color: '#6f7a71',
        fontSize: 14,
        fontWeight: '700',
    },
    lockedTag: {
        color: '#ffddb8',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    goalCard: {
        backgroundColor: '#00429B',
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.14,
        shadowRadius: 32,
        elevation: 10,
    },
    goalCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 22,
    },
    goalEyebrow: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    goalTitle: {
        color: colors.white,
        fontWeight: '800',
        lineHeight: 34,
        letterSpacing: -0.8,
        maxWidth: 220,
    },
    goalIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 22,
    },
    goalProgressTrack: {
        flex: 1,
        height: 14,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.14)',
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#7cf0aa',
    },
    goalPercentText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '800',
        minWidth: 44,
        textAlign: 'right',
    },
    goalMetaRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },
    goalMetaLabel: {
        color: 'rgba(255,255,255,0.64)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    goalMetaValue: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
    goalArrowWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    goalQuoteWrap: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.20)',
    },
    goalQuoteLabel: {
        color: 'rgba(255,255,255,0.64)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    goalQuoteText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 23,
    },
    errorText: {
        marginTop: 16,
        color: colors.secondary,
        fontSize: 13,
        fontWeight: '600',
    },
});
