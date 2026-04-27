import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { dashboardApi } from '../api';
import { GeneralSummaryResponse } from '../types';
import { colors, useResponsiveLayout } from '../theme';

export const GeneralSummaryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { horizontalPadding, isCompact, rfs, rs, rv } = useResponsiveLayout();
    const [summary, setSummary] = useState<GeneralSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = useCallback(async (refreshing = false) => {
        if (refreshing) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await dashboardApi.getGeneralSummary();
            setSummary(response);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load summary.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const formatCurrency = (amount: number | undefined | null) =>
        `$${(amount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;

    const formatHours = (hours: number | undefined | null) =>
        `${(hours ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        })}h`;

    const formatDate = (date: string | null | undefined) => {
        if (!date) {
            return 'No date';
        }

        return new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const hasData = Boolean(summary && (summary.totalEarnings > 0 || summary.totalExpenses > 0 || summary.totalHours > 0));
    const headlineCards = summary
        ? [
            { label: 'Total Earned', value: formatCurrency(summary.totalEarnings), tone: 'primary' },
            { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses), tone: 'orange' },
            { label: 'Net Earnings', value: formatCurrency(summary.netEarnings), tone: summary.netEarnings >= 0 ? 'green' : 'red' },
            { label: 'Total Hours', value: formatHours(summary.totalHours), tone: 'neutral' },
        ]
        : [];

    if (isLoading && !summary) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />
            <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: rv(8, 0.72, 1) }]}>
                <TouchableOpacity
                    style={[styles.headerButton, { width: rs(42), height: rs(42), borderRadius: rs(21) }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Feather name="arrow-left" size={22} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: rfs(isCompact ? 18 : 21, 0.9, 1) }]}>General Summary</Text>
                <View style={{ width: rs(42), height: rs(42) }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: rv(16, 0.74, 1),
                    paddingBottom: rv(156, 0.82, 1),
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSummary(true)} />}
            >
                {error ? (
                    <View style={[styles.errorCard, { borderRadius: rs(24, 0.86, 1), padding: rs(22, 0.84, 1) }]}>
                        <Text style={styles.errorTitle}>Summary unavailable</Text>
                        <Text style={styles.errorCopy}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => loadSummary()} activeOpacity={0.84}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {!error && summary ? (
                    <>
                        <View style={[styles.heroCard, { borderRadius: rs(30, 0.86, 1), padding: rs(26, 0.84, 1), marginBottom: rv(18, 0.74, 1) }]}>
                            <Text style={styles.heroEyebrow}>All-time picture</Text>
                            <Text style={[styles.heroTitle, { fontSize: rfs(isCompact ? 32 : 36, 0.84, 1) }]}>
                                Your work and spending summary
                            </Text>
                            <Text style={[styles.heroCopy, { fontSize: rfs(15, 0.9, 1), lineHeight: Math.round(rfs(15, 0.9, 1) * 1.5) }]}>
                                A single view of everything you have earned, spent, and kept across your Chickaree history.
                            </Text>
                        </View>

                        {!hasData ? (
                            <View style={[styles.emptyCard, { borderRadius: rs(24, 0.86, 1), padding: rs(22, 0.84, 1) }]}>
                                <MaterialIcons name="insights" size={28} color={colors.primary} />
                                <Text style={styles.emptyTitle}>No summary yet</Text>
                                <Text style={styles.emptyCopy}>Add entries and expenses to build your general summary.</Text>
                            </View>
                        ) : null}

                        <View style={[styles.headlineGrid, { gap: rs(12, 0.82, 1), marginBottom: rv(18, 0.74, 1) }]}>
                            {headlineCards.map((card) => (
                                <View key={card.label} style={[styles.metricCard, getMetricCardToneStyle(card.tone), { borderRadius: rs(22, 0.86, 1), padding: rs(18, 0.84, 1) }]}>
                                    <Text style={styles.metricLabel}>{card.label}</Text>
                                    <Text style={[styles.metricValue, { fontSize: rfs(isCompact ? 22 : 25, 0.86, 1) }]}>{card.value}</Text>
                                </View>
                            ))}
                        </View>

                        <SummarySection title="By Job">
                            {summary.jobs.length ? summary.jobs.map((job) => (
                                <SummaryRow
                                    key={job.jobId}
                                    title={job.jobTitle}
                                    subtitle={formatHours(job.totalHours)}
                                    value={formatCurrency(job.totalEarnings)}
                                />
                            )) : <EmptyLine text="No job earnings yet." />}
                        </SummarySection>

                        <SummarySection title="By Month">
                            {summary.months.length ? summary.months.map((month) => (
                                <SummaryRow
                                    key={`${month.year}-${month.month}`}
                                    title={month.monthLabel}
                                    subtitle={`${formatCurrency(month.earnings)} earned - ${formatCurrency(month.expenses)} spent`}
                                    value={formatCurrency(month.netEarnings)}
                                />
                            )) : <EmptyLine text="No monthly activity yet." />}
                        </SummarySection>

                        <SummarySection title="Monthly Job Earnings">
                            {summary.monthlyJobs.length ? summary.monthlyJobs.map((item) => (
                                <SummaryRow
                                    key={`${item.jobId}-${item.year}-${item.month}`}
                                    title={item.jobTitle}
                                    subtitle={item.monthLabel}
                                    value={formatCurrency(item.earnings)}
                                />
                            )) : <EmptyLine text="No monthly job earnings yet." />}
                        </SummarySection>

                        <SummarySection title="Insights">
                            <SummaryRow
                                title="Average Weekly Hours"
                                subtitle="Worked weeks only"
                                value={formatHours(summary.averageWeeklyHours)}
                            />
                            {summary.largestPurchase ? (
                                <SummaryRow
                                    title="Largest Purchase"
                                    subtitle={`${summary.largestPurchase.title} - ${formatDate(summary.largestPurchase.date)}`}
                                    value={formatCurrency(summary.largestPurchase.amount)}
                                />
                            ) : (
                                <EmptyLine text="No purchases yet." />
                            )}
                        </SummarySection>

                        <SummarySection title="Average Weekly Hours by Job">
                            {summary.averageWeeklyHoursByJob.length ? summary.averageWeeklyHoursByJob.map((job) => (
                                <SummaryRow
                                    key={job.jobId}
                                    title={job.jobTitle}
                                    subtitle="Worked weeks only"
                                    value={formatHours(job.averageWeeklyHours)}
                                />
                            )) : <EmptyLine text="No job hours yet." />}
                        </SummarySection>
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const SummarySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionCard}>{children}</View>
    </View>
);

const SummaryRow: React.FC<{ title: string; subtitle: string; value: string }> = ({ title, subtitle, value }) => (
    <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
            <Text numberOfLines={1} style={styles.summaryTitle}>{title}</Text>
            <Text numberOfLines={1} style={styles.summarySubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
    <Text style={styles.emptyLine}>{text}</Text>
);

const getMetricCardToneStyle = (tone: string) => {
    switch (tone) {
        case 'primary':
            return styles.metricCard_primary;
        case 'orange':
            return styles.metricCard_orange;
        case 'green':
            return styles.metricCard_green;
        case 'red':
            return styles.metricCard_red;
        case 'neutral':
        default:
            return styles.metricCard_neutral;
    }
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButton: {
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: colors.primary,
        fontWeight: '800',
    },
    container: {
        flex: 1,
    },
    heroCard: {
        backgroundColor: colors.white,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.04,
        shadowRadius: 38,
        elevation: 4,
    },
    heroEyebrow: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    heroTitle: {
        color: colors.primary,
        fontWeight: '800',
        marginBottom: 10,
    },
    heroCopy: {
        color: colors.onSurfaceVariant,
        fontWeight: '500',
    },
    headlineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    metricCard: {
        width: '48%',
        minHeight: 112,
        justifyContent: 'space-between',
    },
    metricCard_primary: {
        backgroundColor: colors.primary,
    },
    metricCard_orange: {
        backgroundColor: '#ff8a00',
    },
    metricCard_green: {
        backgroundColor: '#0b6b45',
    },
    metricCard_red: {
        backgroundColor: colors.danger,
    },
    metricCard_neutral: {
        backgroundColor: '#2d3748',
    },
    metricLabel: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0,
        textTransform: 'uppercase',
    },
    metricValue: {
        color: colors.white,
        fontWeight: '800',
    },
    section: {
        marginBottom: 18,
    },
    sectionTitle: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 10,
    },
    sectionCard: {
        backgroundColor: colors.white,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    summaryRow: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#edf0ea',
    },
    summaryCopy: {
        flex: 1,
    },
    summaryTitle: {
        color: colors.onSurface,
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 3,
    },
    summarySubtitle: {
        color: colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '600',
    },
    summaryValue: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '800',
    },
    emptyLine: {
        color: colors.onSurfaceVariant,
        fontSize: 13,
        fontWeight: '600',
        paddingVertical: 16,
    },
    emptyCard: {
        backgroundColor: colors.white,
        alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '800',
        marginTop: 10,
        marginBottom: 4,
    },
    emptyCopy: {
        color: colors.onSurfaceVariant,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    errorCard: {
        backgroundColor: colors.white,
        marginBottom: 18,
    },
    errorTitle: {
        color: colors.danger,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    errorCopy: {
        color: colors.onSurfaceVariant,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 19,
        marginBottom: 14,
    },
    retryButton: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        backgroundColor: colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    retryText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '800',
    },
});
