import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Image,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../types';
import { useJobsStore } from '../stores';
import { CreateJobModal } from '../components/CreateJobModal';
import { colors } from '../theme';

type DashboardNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

const PROFILE_IMAGE_URI =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCBko3OImouiS8kFbSbaWowPUn1Ra9b3jM81WBVZiRS4P04jztGsUtI84-UQDRc71sWzvbuKAnx2xOXCpBoWrm4tJokRICcHE4AJ2cfMF7wAZS_HBVlHj-GOEUaMgRqDNwsTkB5VS4ObTRfUC4-KkEeYBv7czd8aIZ1qcn_V40T5nZVJZCrCcYK3MJkhC32DU4BQX9TGsIr-TCkE6UA8i5_qF2tIhwpzrxUzfoW-0UsRkBHoLAnxqTaGmTzlwgPyp1gjFwYWBOePRMm';

const chartHeights = [40, 65, 55, 85, 70, 100, 10];
const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const navigation = useNavigation<DashboardNavigationProp>();
    const { summary, jobs, error, fetchDashboard } = useJobsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const scale = Math.min(Math.max(width / 393, 0.84), 1);
    const isCompact = width < 380;
    const heroPadding = 32 * scale;
    const sectionTitleSize = isCompact ? 24 : 28;
    const heroValueSize = isCompact ? 40 : 48;
    const heroValueLineHeight = isCompact ? 46 : 56;
    const gigCardWidth = Math.min(Math.max(width - 104, 228), 264);
    const addGigCardWidth = Math.min(Math.max(width - 176, 168), 188);
    const horizontalPadding = isCompact ? 18 : 24;

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

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

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
                        onPress={() => (navigation as any).navigate('ProfileTab')}
                    >
                        <View style={styles.avatarFrame}>
                            <Image source={{ uri: PROFILE_IMAGE_URI }} style={styles.avatarImage} />
                        </View>
                        <Text style={styles.brandText}>The Kinetic Ledger</Text>
                    </TouchableOpacity>

                    <View style={styles.currencyPill}>
                        <Text style={styles.currencyText}>USD ($)</Text>
                    </View>
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
                        <Text style={styles.heroLabel}>Total Earnings This Week</Text>
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
                            {chartHeights.map((height, index) => {
                                const backgroundColor =
                                    index === 5
                                        ? colors.primary
                                        : index === 4
                                          ? 'rgba(0, 109, 68, 0.20)'
                                          : index === 6
                                            ? colors.surfaceContainerHigh
                                            : 'rgba(0, 109, 68, 0.10)';

                                return (
                                    <View
                                        key={chartLabels[index]}
                                        style={[
                                            styles.chartBar,
                                            {
                                                height: `${height}%`,
                                                backgroundColor,
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </View>

                        <View style={styles.chartLabelsRow}>
                            {chartLabels.map((label, index) => (
                                <Text key={label} style={[styles.chartLabel, index === 5 && styles.chartLabelActive]}>
                                    {label}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Active Gigs</Text>
                    <Text style={styles.sectionMeta}>{jobs.length} Active</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        gap: 16 * scale,
                        paddingLeft: 0,
                        paddingRight: horizontalPadding,
                        paddingBottom: 8,
                    }}
                >
                    {jobs.slice(0, 2).map((job, index) => {
                        const isPrimary = index === 0;
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
                                    isPrimary ? styles.gigCardPrimary : styles.gigCardTertiary,
                                ]}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                            >
                                <View style={styles.gigGlow} />

                                <View>
                                    <View style={styles.gigTopRow}>
                                        <MaterialIcons
                                            name={isPrimary ? 'hotel' : 'restaurant'}
                                            size={Math.round(32 * scale)}
                                            color={colors.white}
                                        />
                                        <View style={styles.gigBadge}>
                                            <Text style={styles.gigBadgeText}>
                                                {isPrimary ? 'Main Job' : 'Part-time'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.gigTitle, { fontSize: isCompact ? 18 : 21 }]}>{job.title}</Text>
                                    <Text style={[styles.gigSubtitle, { fontSize: isCompact ? 12 : 13 }]}>
                                        {isPrimary ? 'Grand Canyon Lodge' : 'Sunset Grill & Bar'}
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
                        onPress={() => setIsModalOpen(true)}
                    >
                        <MaterialIcons name="add-circle" size={Math.round(28 * scale)} color={colors.outline} />
                        <Text style={styles.addGigText}>Add Gig</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/*
                <View style={styles.goalCard}>
                    Travel goal is intentionally kept for later reuse.
                </View>
                */}

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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    brandBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexShrink: 1,
    },
    avatarFrame: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#efeee5',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    brandText: {
        color: '#006D44',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    currencyPill: {
        backgroundColor: '#f5f4eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
    },
    currencyText: {
        color: '#006D44',
        fontSize: 14,
        fontWeight: '700',
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
        color: '#006D44',
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 24,
        textAlign: 'center',
    },
    chartRow: {
        width: '100%',
        height: 128,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 16,
    },
    chartBar: {
        flex: 1,
        borderTopLeftRadius: 9999,
        borderTopRightRadius: 9999,
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
        color: '#006D44',
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
        color: '#006D44',
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
        backgroundColor: '#006D44',
    },
    gigCardTertiary: {
        backgroundColor: '#00429B',
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    gigBadge: {
        backgroundColor: 'rgba(255,255,255,0.20)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9999,
    },
    gigBadgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '700',
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
    errorText: {
        marginTop: 16,
        color: colors.secondary,
        fontSize: 13,
        fontWeight: '600',
    },
    goalCard: {
        display: 'none',
    },
});
