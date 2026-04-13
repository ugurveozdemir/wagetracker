import React, { useCallback, useMemo, useState } from 'react';
import {
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useJobsStore } from '../stores';
import { OverviewStackParamList, RootStackParamList } from '../types';
import { colors } from '../theme';
import { CreateJobModal } from '../components/CreateJobModal';
import { LockedFeatureModal } from '../components/LockedFeaturePreview';

type OverviewNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<OverviewStackParamList, 'Overview'>,
    NativeStackNavigationProp<RootStackParamList>
>;

type PaywallTarget = RootStackParamList['Paywall'];

const overviewCardThemes = [
    { tone: 'primary', icon: 'cleaning-services' },
    { tone: 'secondary', icon: 'local-bar' },
    { tone: 'tertiary', icon: 'directions-car' },
    { tone: 'quaternary', icon: 'storefront' },
] as const;

export const OverviewScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const navigation = useNavigation<OverviewNavigationProp>();
    const { user } = useAuthStore();
    const { summary, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateJobModal, setShowCreateJobModal] = useState(false);
    const [showJobLimitLocked, setShowJobLimitLocked] = useState(false);
    const scale = Math.min(Math.max(width / 393, 0.84), 1);
    const compact = width < 380;
    const horizontalPadding = compact ? 18 : 24;
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
                    paddingTop: 18,
                    paddingBottom: 170,
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { fontSize: compact ? 34 : 38 }]}>My Jobs</Text>

                <View style={[styles.jobsStack, { gap: 18 * scale }]}>
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
                                    minHeight: 256 * scale,
                                    padding: 22 * scale,
                                    borderRadius: 24 * scale,
                                },
                            ]}
                        >
                            <View
                                style={styles.cardGlow}
                            />

                            <View style={styles.jobTop}>
                                <MaterialIcons
                                    name={job.icon}
                                    size={Math.round(32 * scale)}
                                    color={colors.white}
                                />
                            </View>

                            <View>
                                <Text style={[styles.jobName, { fontSize: compact ? 24 : 27 }]}>{job.title}</Text>
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
                                        <Text style={[styles.rateSuffix, { fontSize: compact ? 12 : 14 }]}>/hr</Text>
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
                        style={[styles.addJobCard, { minHeight: 256 * scale, borderRadius: 24 * scale }]}
                        onPress={() => {
                            if (!user?.subscription.isPremium && jobs.length >= 2) {
                                setShowJobLimitLocked(true);
                                return;
                            }

                            setShowCreateJobModal(true);
                        }}
                    >
                        <View style={styles.addIconWrap}>
                            <MaterialIcons name="add" size={30} color="#8a948d" />
                        </View>
                        <Text style={styles.addJobTitle}>{!user?.subscription.isPremium && jobs.length >= 2 ? 'Upgrade for more' : 'Add New Job'}</Text>
                        <Text style={styles.addJobCopy}>
                            {!user?.subscription.isPremium && jobs.length >= 2
                                ? 'Free accounts keep 2 jobs unlocked. Upgrade to add more without locking older roles.'
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
        color: '#006D44',
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
        backgroundColor: '#006D44',
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
    jobTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    jobName: {
        color: colors.white,
        fontSize: 27,
        fontWeight: '700',
        marginBottom: 18,
        letterSpacing: -0.6,
    },
    ratePill: {
        alignSelf: 'flex-start',
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
