import React, { useEffect, useState, useCallback } from 'react';
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
    const { summary, isLoading, fetchDashboard } = useJobsStore();
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>Overview</Text>
                <Text style={styles.subtitle}>All-time summary</Text>

                {/* Net Income - Hero Card */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>NET INCOME</Text>
                    <Text style={[styles.heroValue, netIncome < 0 && styles.heroValueNegative]}>
                        {netIncome < 0 ? '-' : ''}{formatCurrency(Math.abs(netIncome))}
                    </Text>
                    <View style={styles.heroBar}>
                        <View style={styles.heroBarTrack}>
                            {totalEarnings > 0 && (
                                <View
                                    style={[
                                        styles.heroBarFill,
                                        {
                                            width: `${Math.min(
                                                (totalExpenses / totalEarnings) * 100,
                                                100
                                            )}%`,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                        <View style={styles.heroBarLabels}>
                            <Text style={styles.heroBarLabel}>
                                Spent {totalEarnings > 0
                                    ? `${((totalExpenses / totalEarnings) * 100).toFixed(0)}%`
                                    : '0%'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Earnings */}
                    <Card variant="earnings" style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>💰</Text>
                            <Text style={styles.statLabel}>EARNINGS</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {formatCurrency(totalEarnings)}
                        </Text>
                        <Text style={styles.statSubtext}>Total earned</Text>
                    </Card>

                    {/* Expenses */}
                    <View style={styles.expenseCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>💸</Text>
                            <Text style={[styles.statLabel, { color: 'rgba(239,68,68,0.8)' }]}>
                                EXPENSES
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.white }]}>
                            {formatCurrency(totalExpenses)}
                        </Text>
                        <Text style={[styles.statSubtext, { color: 'rgba(255,255,255,0.7)' }]}>
                            Total spent
                        </Text>
                    </View>
                </View>

                {/* Additional Stats */}
                <View style={styles.statsGrid}>
                    {/* Hours */}
                    <Card variant="hours" style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>⏳</Text>
                            <Text style={styles.statLabel}>HOURS</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {totalHours.toFixed(1)}
                            <Text style={styles.statUnit}>h</Text>
                        </Text>
                        <Text style={styles.statSubtext}>Total worked</Text>
                    </Card>

                    {/* Active Jobs */}
                    <View style={styles.jobsCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>💼</Text>
                            <Text style={[styles.statLabel, { color: colors.slate400 }]}>
                                JOBS
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.slate800 }]}>
                            {activeJobs}
                        </Text>
                        <Text style={[styles.statSubtext, { color: colors.slate400 }]}>
                            Active jobs
                        </Text>
                    </View>
                </View>

                {/* Per-job breakdown */}
                {summary?.jobs && summary.jobs.length > 0 && (
                    <View style={styles.jobsSection}>
                        <Text style={styles.sectionTitle}>Earnings by Job</Text>
                        {summary.jobs.map((job) => (
                            <View key={job.id} style={styles.jobRow}>
                                <View style={styles.jobInfo}>
                                    <Text style={styles.jobName}>{job.title}</Text>
                                    <Text style={styles.jobHours}>
                                        {job.totalHours.toFixed(1)}h worked
                                    </Text>
                                </View>
                                <Text style={styles.jobEarnings}>
                                    {formatCurrency(job.totalEarnings)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    subtitle: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
        marginBottom: spacing.xl,
    },

    // Hero Card
    heroCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        padding: spacing.xl,
        marginBottom: spacing.lg,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    heroLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    heroValue: {
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.emerald,
        marginBottom: spacing.lg,
    },
    heroValueNegative: {
        color: '#ef4444',
    },
    heroBar: {
        marginTop: spacing.sm,
    },
    heroBarTrack: {
        height: 8,
        backgroundColor: colors.emerald + '30',
        borderRadius: 4,
        overflow: 'hidden',
    },
    heroBarFill: {
        height: '100%',
        backgroundColor: '#ef4444',
        borderRadius: 4,
    },
    heroBarLabels: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing.xs,
    },
    heroBarLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        color: colors.slate400,
    },

    // Stats
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        minHeight: 130,
    },
    expenseCard: {
        flex: 1,
        minHeight: 130,
        backgroundColor: '#ef4444',
        borderRadius: borderRadius['3xl'],
        padding: spacing.lg,
    },
    jobsCard: {
        flex: 1,
        minHeight: 130,
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        padding: spacing.lg,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statEmoji: {
        fontSize: 20,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: fontWeights.bold,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.white,
    },
    statUnit: {
        fontSize: fontSizes.xl,
        opacity: 0.8,
    },
    statSubtext: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        color: 'rgba(255,255,255,0.7)',
        marginTop: spacing.xs,
    },

    // Jobs section
    jobsSection: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.md,
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.sm,
    },
    jobInfo: {
        flex: 1,
    },
    jobName: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate800,
    },
    jobHours: {
        fontSize: fontSizes.sm,
        color: colors.slate400,
        marginTop: 2,
    },
    jobEarnings: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.emerald,
    },
});
