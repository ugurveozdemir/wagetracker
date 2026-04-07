import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobsStore } from '../stores';
import { Card } from '../components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

export const OverviewScreen: React.FC = () => {
    const { summary, fetchDashboard } = useJobsStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboard();
        setRefreshing(false);
    }, [fetchDashboard]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const totalEarnings = summary?.totalEarnings || 0;
    const totalExpenses = summary?.totalExpenses || 0;
    const totalHours = summary?.totalHours || 0;
    const netIncome = totalEarnings - totalExpenses;
    const activeJobs = summary?.activeJobsCount || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.eyebrow}>All-time Summary</Text>
                <Text style={styles.title}>Overview</Text>
                <Text style={styles.subtitle}>
                    Read the ledger at a glance: net, hours, spending, and each role’s contribution.
                </Text>

                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Net Income</Text>
                    <Text style={[styles.heroValue, netIncome < 0 && styles.heroValueNegative]}>
                        {netIncome < 0 ? '-' : ''}
                        {formatCurrency(Math.abs(netIncome))}
                    </Text>
                    <View style={styles.heroBarTrack}>
                        <View
                            style={[
                                styles.heroBarFill,
                                {
                                    width: `${totalEarnings > 0
                                        ? Math.min((totalExpenses / totalEarnings) * 100, 100)
                                        : 0}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.heroBarLabel}>
                        Spent {totalEarnings > 0 ? `${((totalExpenses / totalEarnings) * 100).toFixed(0)}%` : '0%'}
                    </Text>
                </View>

                <View style={styles.statsGrid}>
                    <Card variant="earnings" style={styles.statCard}>
                        <Text style={styles.statLabel}>Earnings</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalEarnings)}</Text>
                        <Text style={styles.statSubtext}>Total earned</Text>
                    </Card>

                    <View style={styles.lossCard}>
                        <Text style={styles.statLabelLight}>Expenses</Text>
                        <Text style={styles.statValueLight}>{formatCurrency(totalExpenses)}</Text>
                        <Text style={styles.statSubtextLight}>Total spent</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <Card variant="hours" style={styles.statCard}>
                        <Text style={styles.statLabel}>Hours</Text>
                        <Text style={styles.statValue}>
                            {totalHours.toFixed(1)}
                            <Text style={styles.unit}>h</Text>
                        </Text>
                        <Text style={styles.statSubtext}>Worked time</Text>
                    </Card>

                    <View style={styles.jobsCard}>
                        <Text style={styles.jobsLabel}>Jobs</Text>
                        <Text style={styles.jobsValue}>{activeJobs}</Text>
                        <Text style={styles.jobsSubtext}>Active roles</Text>
                    </View>
                </View>

                {summary?.jobs?.length ? (
                    <View style={styles.jobsSection}>
                        <Text style={styles.sectionTitle}>Earnings by Job</Text>
                        {summary.jobs.map((job) => (
                            <View key={job.id} style={styles.jobRow}>
                                <View style={styles.jobInfo}>
                                    <Text style={styles.jobName}>{job.title}</Text>
                                    <Text style={styles.jobHours}>{job.totalHours.toFixed(1)}h worked</Text>
                                </View>
                                <Text style={styles.jobEarnings}>{formatCurrency(job.totalEarnings)}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
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
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    eyebrow: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    title: {
        color: colors.onSurface,
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    subtitle: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
        marginBottom: spacing.xl,
        maxWidth: 320,
    },
    heroCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.xl,
        padding: spacing['3xl'],
        marginBottom: spacing.lg,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.05,
        shadowRadius: 40,
        elevation: 6,
    },
    heroLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    heroValue: {
        color: colors.primary,
        fontSize: 44,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.lg,
    },
    heroValueNegative: {
        color: colors.secondaryContainer,
    },
    heroBarTrack: {
        height: 10,
        backgroundColor: 'rgba(0, 109, 68, 0.14)',
        borderRadius: 999,
        overflow: 'hidden',
    },
    heroBarFill: {
        height: '100%',
        backgroundColor: colors.secondaryContainer,
        borderRadius: 999,
    },
    heroBarLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        marginTop: spacing.sm,
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        minHeight: 150,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: spacing.lg,
    },
    statValue: {
        color: colors.white,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
    },
    statSubtext: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: fontSizes.sm,
        marginTop: spacing.sm,
    },
    unit: {
        fontSize: fontSizes.xl,
        opacity: 0.85,
    },
    lossCard: {
        flex: 1,
        minHeight: 150,
        backgroundColor: colors.secondaryContainer,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
    },
    statLabelLight: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: spacing.lg,
    },
    statValueLight: {
        color: colors.white,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
    },
    statSubtextLight: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: fontSizes.sm,
        marginTop: spacing.sm,
    },
    jobsCard: {
        flex: 1,
        minHeight: 150,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
    },
    jobsLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: spacing.lg,
    },
    jobsValue: {
        color: colors.onSurface,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
    },
    jobsSubtext: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        marginTop: spacing.sm,
    },
    jobsSection: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.md,
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.sm,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
    },
    jobInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    jobName: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        marginBottom: 2,
    },
    jobHours: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
    },
    jobEarnings: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
});
