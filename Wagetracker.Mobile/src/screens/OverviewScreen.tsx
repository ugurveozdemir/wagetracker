import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useJobsStore, useSubscriptionStore } from '../stores';
import { OverviewStackParamList, RootStackParamList } from '../types';
import { colors, useResponsiveLayout } from '../theme';
import { CreateJobModal } from '../components/CreateJobModal';
import { LockedFeatureModal } from '../components/LockedFeaturePreview';

type OverviewNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<OverviewStackParamList, 'Overview'>,
    NativeStackNavigationProp<RootStackParamList>
>;

type PaywallTarget = RootStackParamList['Paywall'];

const overviewCardThemes = [
    { tone: 'primary' },
    { tone: 'secondary' },
    { tone: 'tertiary' },
    { tone: 'quaternary' },
] as const;

export const OverviewScreen: React.FC = () => {
    const { horizontalPadding, isCompact: compactLayout, rfs, rs, rv } = useResponsiveLayout();
    const navigation = useNavigation<OverviewNavigationProp>();
    const { user } = useAuthStore();
    const { summary, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const canStartTrial = useSubscriptionStore((state) => state.hasEligibleFreeTrial());
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateJobModal, setShowCreateJobModal] = useState(false);
    const [showJobLimitLocked, setShowJobLimitLocked] = useState(false);
    const compact = compactLayout;
    const jobs = summary?.jobs ?? [];

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

    const cards = useMemo(
        () =>
            jobs.map((job, index) => ({
                ...job,
                ...overviewCardThemes[index % overviewCardThemes.length],
            })),
        [jobs]
    );
    const openPremiumPaywall = (target: PaywallTarget) => {
        navigation.navigate('Paywall', target);
    };
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
                    paddingTop: rv(18, 0.74, 1),
                    paddingBottom: rv(166, 0.82, 1),
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { fontSize: rfs(compact ? 34 : 38, 0.84, 1), marginBottom: rv(8, 0.74, 1) }]}>My Jobs</Text>

                <View style={[styles.jobsStack, { gap: rv(18, 0.78, 1) }]}>
                    {cards.map((job) => (
                        <TouchableOpacity
                            key={job.id}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                            style={[
                                styles.jobCard,
                                job.tone === 'primary'
                                    ? styles.jobCardPrimary
                                    : job.tone === 'secondary'
                                      ? styles.jobCardSecondary
                                      : job.tone === 'tertiary'
                                        ? styles.jobCardTertiary
                                        : styles.jobCardQuaternary,
                                {
                                    minHeight: rv(256, 0.84, 1),
                                    padding: rs(22, 0.84, 1),
                                    borderRadius: rs(24, 0.86, 1),
                                },
                            ]}
                        >
                            <View
                                style={styles.cardGlow}
                            />

                            <View style={styles.jobMain}>
                                <Text style={[styles.jobName, { fontSize: rfs(compact ? 24 : 27, 0.86, 1), marginBottom: rv(18, 0.74, 1) }]}>{job.title}</Text>
                                {job.isLocked ? <Text style={styles.lockedTag}>Locked on free tier</Text> : null}
                                <View
                                    style={[
                                        styles.ratePill,
                                        job.tone === 'primary' ? styles.ratePillPrimary : styles.ratePillSecondary,
                                    ]}
                                >
                                    <Text style={styles.rateLabel}>RATE</Text>
                                    <Text
                                        style={[
                                            styles.rateValue,
                                            job.tone === 'primary' ? styles.rateValuePrimary : styles.rateValueSecondary,
                                        ]}
                                    >
                                        ${job.hourlyRate.toFixed(2)}
                                        <Text style={[styles.rateSuffix, { fontSize: rfs(compact ? 12 : 14, 0.9, 1) }]}>/hr</Text>
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.earnedSection,
                                    job.tone === 'primary' ? styles.earnedSectionPrimary : styles.earnedSectionSecondary,
                                ]}
                            >
                                <Text style={styles.earnedLabel}>TOTAL EARNED</Text>
                                <Text
                                    style={[
                                        styles.earnedValue,
                                        job.tone === 'primary' ? styles.earnedValuePrimary : styles.earnedValueSecondary,
                                    ]}
                                >
                                    {formatCurrency(job.totalEarnings)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={[styles.addJobCard, { minHeight: rv(256, 0.84, 1), borderRadius: rs(24, 0.86, 1), paddingHorizontal: rs(28, 0.84, 1) }]}
                        onPress={() => {
                            if (!user?.subscription.isPremium && jobs.length >= 2) {
                                setShowJobLimitLocked(true);
                                return;
                            }

                            setShowCreateJobModal(true);
                        }}
                    >
                        <View
                            style={[
                                styles.addIconWrap,
                                {
                                    width: rs(64, 0.84, 1),
                                    height: rs(64, 0.84, 1),
                                    borderRadius: rs(32, 0.84, 1),
                                    marginBottom: rv(16, 0.74, 1),
                                },
                            ]}
                        >
                            <MaterialIcons name="add" size={Math.round(rs(30, 0.86, 1))} color="#8a948d" />
                        </View>
                        <Text style={[styles.addJobTitle, { fontSize: rfs(26, 0.86, 1) }]}>{!user?.subscription.isPremium && jobs.length >= 2 ? (canStartTrial ? 'Try Pro free' : 'Unlock Pro') : 'Add New Job'}</Text>
                        <Text style={[styles.addJobCopy, { fontSize: rfs(15, 0.9, 1), lineHeight: Math.round(rfs(15, 0.9, 1) * 1.6) }]}>
                            {!user?.subscription.isPremium && jobs.length >= 2
                                ? 'Free accounts keep 2 jobs unlocked. Pro adds more roles without locking older work.'
                                : 'Maximize your income by tracking a second or third role.'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*
                <View style={[styles.goalCard, { borderRadius: 24 * scale, padding: 24 * scale }]}>
                    <Text style={styles.goalLabel}>TRAVEL GOAL</Text>
                </View>
                */}

                <CreateJobModal
                    visible={showCreateJobModal}
                    onClose={() => setShowCreateJobModal(false)}
                    onCreated={() => {
                        setShowCreateJobModal(false);
                        fetchDashboard();
                    }}
                />
                <LockedFeatureModal
                    visible={showJobLimitLocked}
                    feature="jobs"
                    onClose={() => setShowJobLimitLocked(false)}
                    onUnlock={openJobLimitPaywall}
                />
            </ScrollView>
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
    title: {
        color: '#005232',
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 8,
    },
    jobsStack: {
        marginBottom: 24,
    },
    jobCard: {
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 8,
    },
    jobCardPrimary: {
        backgroundColor: '#005232',
    },
    jobCardSecondary: {
        backgroundColor: '#00429B',
    },
    jobCardTertiary: {
        backgroundColor: '#0d9488',
    },
    jobCardQuaternary: {
        backgroundColor: '#64748b',
    },
    cardGlow: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: 96,
        height: 96,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    jobMain: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    jobName: {
        color: colors.white,
        fontSize: 27,
        fontWeight: '800',
        marginBottom: 18,
        letterSpacing: -0.6,
        textAlign: 'center',
    },
    ratePill: {
        alignSelf: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999,
    },
    ratePillPrimary: {
        backgroundColor: 'rgba(255,255,255,0.20)',
    },
    ratePillSecondary: {
        backgroundColor: 'rgba(255,255,255,0.20)',
    },
    rateLabel: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    rateValue: {
        fontSize: 21,
        fontWeight: '700',
    },
    rateValuePrimary: {
        color: colors.white,
    },
    rateValueSecondary: {
        color: colors.white,
    },
    rateSuffix: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '400',
        opacity: 0.6,
    },
    earnedSection: {
        paddingTop: 18,
        marginTop: 18,
        alignItems: 'center',
    },
    earnedSectionPrimary: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.20)',
    },
    earnedSectionSecondary: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.20)',
    },
    earnedLabel: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.6,
        marginBottom: 4,
    },
    earnedValue: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
        textAlign: 'center',
    },
    earnedValuePrimary: {
        color: colors.white,
    },
    earnedValueSecondary: {
        color: colors.white,
    },
    addJobCard: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#bec9bf',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    addIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eae8e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    addJobTitle: {
        color: '#181d19',
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 8,
    },
    addJobCopy: {
        color: '#3f4942',
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        maxWidth: 260,
    },
    lockedTag: {
        color: '#ffddb8',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    goalCard: {
        backgroundColor: '#00429B',
        marginBottom: 12,
    },
    goalLabel: {
        color: '#d9e2ff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
    },
    goalPercent: {
        color: '#ffffff',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    goalRoute: {
        color: '#cbd8ff',
        fontSize: 13,
        fontWeight: '700',
    },
    goalTrack: {
        height: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
        marginBottom: 12,
    },
    goalFill: {
        width: '85%',
        height: '100%',
        backgroundColor: '#ffffff',
    },
    goalCopy: {
        color: '#d9e2ff',
        fontSize: 13,
        lineHeight: 20,
    },
});
