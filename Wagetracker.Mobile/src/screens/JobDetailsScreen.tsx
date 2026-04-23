import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    Pressable,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { MainStackParamList, WeeklyGroupResponse, EntryResponse } from '../types';
import { useEntriesStore, useJobsStore } from '../stores';
import { Card } from '../components/ui';
import { AddEntryModal } from '../components/AddEntryModal';
import { EditJobModal } from '../components/EditJobModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius, useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

type JobDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'JobDetails'>;
type JobDetailsRouteProp = RouteProp<MainStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<JobDetailsRouteProp>();
    const { jobId } = route.params;
    const { isCompact, horizontalPadding, panelRadius, metrics, rfs, rs, rv } = useResponsiveLayout();

    const { jobDetails, weeks, isLoading, fetchJobDetails, deleteEntry, clearJobDetails } = useEntriesStore();
    const { fetchDashboard, deleteJob } = useJobsStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchJobDetails(jobId);
        }, [jobId, fetchJobDetails])
    );

    useEffect(() => {
        return () => clearJobDetails();
    }, [clearJobDetails]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobDetails(jobId);
        setRefreshing(false);
    }, [jobId, fetchJobDetails]);

    const handleEditJob = () => {
        setShowOptionsMenu(false);
        setIsEditModalOpen(true);
    };

    const handleDeleteEntry = (entryId: number) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEntry(entryId);
                            Toast.show({
                                type: 'delete',
                                text1: 'Entry Deleted',
                                text2: 'The entry has been removed',
                                visibilityTime: 2000,
                            });
                            fetchJobDetails(jobId);
                            fetchDashboard();
                        } catch {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete entry',
                                visibilityTime: 3000,
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteJob = () => {
        setShowOptionsMenu(false);
        Alert.alert(
            'Delete Job',
            'Are you sure you want to delete this job? All entries will also be deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteJob(jobId);
                            Toast.show({
                                type: 'delete',
                                text1: 'Job Deleted',
                                text2: `${jobDetails?.job.title} has been removed`,
                                visibilityTime: 2000,
                            });
                            fetchDashboard();
                            navigation.goBack();
                        } catch {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete job',
                                visibilityTime: 3000,
                            });
                        }
                    },
                },
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    if (isLoading && !refreshing && !jobDetails) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const job = jobDetails?.job;
    const isLocked = job?.isLocked ?? false;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { width: rs(42), height: rs(42), borderRadius: rs(21) }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Feather name="arrow-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: rfs(isCompact ? 19 : fontSizes.xl, 0.9, 1) }]} numberOfLines={1}>
                    {job?.title || 'Job'}
                </Text>
                <TouchableOpacity
                    style={[styles.headerButton, { width: rs(42), height: rs(42), borderRadius: rs(21) }]}
                    onPress={() => setShowOptionsMenu(true)}
                    activeOpacity={0.8}
                >
                    <Feather name="more-horizontal" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={showOptionsMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <Pressable style={styles.menuOverlay} onPress={() => setShowOptionsMenu(false)}>
                    <View style={styles.menuContainer}>
                        {!isLocked ? (
                            <TouchableOpacity style={styles.menuItem} onPress={handleEditJob}>
                                <Feather name="edit-2" size={18} color={colors.primary} />
                                <Text style={styles.menuItemText}>Edit Job</Text>
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteJob}>
                            <Feather name="trash-2" size={18} color={colors.secondaryContainer} />
                            <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete Job</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingHorizontal: horizontalPadding, paddingBottom: rv(120, 0.82, 1) },
                ]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.heroCard, { borderRadius: panelRadius, padding: rs(32, 0.82, 1), marginBottom: rv(20, 0.74, 1) }]}>
                    <Text style={styles.heroEyebrow}>Job Ledger</Text>
                    <Text style={[styles.heroTitle, { fontSize: rfs(isCompact ? 30 : fontSizes['4xl'], 0.84, 1), lineHeight: Math.round(rfs(isCompact ? 30 : fontSizes['4xl'], 0.84, 1) * 1.15) }]}>{job?.title}</Text>
                    <Text style={[styles.heroSubcopy, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.55) }]}>
                        ${job?.hourlyRate ?? 0}/hr · tracked with weekly overtime grouping
                    </Text>
                </View>

                <View style={[styles.summaryRow, { gap: rv(12, 0.82, 1), marginBottom: rv(24, 0.74, 1) }]}>
                    <Card variant="earnings" style={[styles.summaryCard, { borderRadius: rs(24), padding: metrics.cardPadding }]}>
                        <Text style={styles.summaryLabel}>Earned</Text>
                        <Text style={[styles.summaryValue, { fontSize: rfs(isCompact ? 26 : fontSizes['3xl'], 0.86, 1) }]}>
                            {formatCurrency(job?.totalEarnings || 0)}
                        </Text>
                    </Card>

                    <Card variant="hours" style={[styles.summaryCard, { borderRadius: rs(24), padding: metrics.cardPadding }]}>
                        <Text style={styles.summaryLabel}>Hours</Text>
                        <Text style={[styles.summaryValue, { fontSize: rfs(isCompact ? 26 : fontSizes['3xl'], 0.86, 1) }]}>
                            {job?.totalHours?.toFixed(1) || '0.0'}
                            <Text style={styles.summaryUnit}>h</Text>
                        </Text>
                    </Card>
                </View>

                {weeks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No entries yet</Text>
                        <Text style={styles.emptyText}>Use the floating add action to log the first shift.</Text>
                    </View>
                ) : (
                    weeks.map((week, index) => (
                        <WeekGroupComponent
                            key={index}
                            week={week}
                            onDeleteEntry={handleDeleteEntry}
                            isLocked={isLocked}
                        />
                    ))
                )}
            </ScrollView>

            <AddEntryModal
                visible={isModalOpen}
                jobId={jobId}
                onClose={() => setIsModalOpen(false)}
                onCreated={() => {
                    setIsModalOpen(false);
                    fetchJobDetails(jobId);
                    fetchDashboard();
                }}
            />

            <EditJobModal
                visible={isEditModalOpen}
                job={jobDetails?.job || null}
                onClose={() => setIsEditModalOpen(false)}
                onUpdated={() => {
                    setIsEditModalOpen(false);
                    fetchJobDetails(jobId);
                    fetchDashboard();
                }}
            />
        </SafeAreaView>
    );
};

interface WeekGroupProps {
    week: WeeklyGroupResponse;
    onDeleteEntry: (id: number) => void;
    isLocked: boolean;
}

const WeekGroupComponent: React.FC<WeekGroupProps> = ({ week, onDeleteEntry, isLocked }) => {
    const { rfs, rs, rv } = useResponsiveLayout();
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`;

    return (
        <View style={[styles.weekGroup, { marginBottom: rv(20, 0.78, 1) }]}>
            <View style={[styles.weekHeader, { marginBottom: rv(12, 0.78, 1) }]}>
                <View>
                    <Text style={[styles.weekTitle, { fontSize: rfs(12, 0.9, 1) }]}>Week of {formatDate(week.weekStart)}</Text>
                    <Text style={[styles.weekSubtitle, { fontSize: rfs(10, 0.92, 1) }]}>to {formatDate(week.weekEnd)}</Text>
                </View>
                <View style={styles.weekTotals}>
                    <Text style={[styles.weekEarnings, { fontSize: rfs(16, 0.9, 1) }]}>{formatCurrency(week.totalEarnings)}</Text>
                    <Text style={[styles.weekHours, { fontSize: rfs(12, 0.9, 1) }]}>{week.totalHours.toFixed(1)}h</Text>
                </View>
            </View>

            {week.overtimeHours > 0 ? (
                <View style={[styles.overtimeBanner, { borderRadius: rs(32, 0.86, 1), padding: rs(16, 0.84, 1), marginBottom: rv(12, 0.78, 1) }]}>
                    <View>
                        <Text style={styles.overtimeLabel}>Overtime included</Text>
                        <Text style={styles.overtimeMeta}>{week.overtimeHours.toFixed(1)}h at premium rate</Text>
                    </View>
                    <Text style={[styles.overtimeValue, { fontSize: rfs(16, 0.9, 1) }]}>{formatCurrency(week.overtimeBonus)}</Text>
                </View>
            ) : null}

            <View style={[styles.entriesContainer, { borderRadius: rs(32, 0.86, 1) }]}>
                {week.entries.map((entry, idx) => (
                    <EntryItem
                        key={entry.id}
                        entry={entry}
                        isLast={idx === week.entries.length - 1}
                        onDelete={() => onDeleteEntry(entry.id)}
                        isLocked={isLocked}
                    />
                ))}
            </View>
        </View>
    );
};

interface EntryItemProps {
    entry: EntryResponse;
    isLast: boolean;
    onDelete: () => void;
    isLocked: boolean;
}

const EntryItem: React.FC<EntryItemProps> = ({ entry, isLast, onDelete, isLocked }) => {
    const { rfs, rs } = useResponsiveLayout();
    const formatTime = (time: string | null) => {
        if (!time) return null;
        const parts = time.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    const getTimeDisplay = () => {
        if (entry.startTime && entry.endTime) {
            return `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`;
        }
        return 'Duration only';
    };

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const actionTranslateX = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [0, 26, 72],
            extrapolate: 'clamp',
        });

        const bgOpacity = dragX.interpolate({
            inputRange: [-120, -32, 0],
            outputRange: [1, 0.82, 0],
            extrapolate: 'clamp',
        });

        const iconTranslateX = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [0, 10, 22],
            extrapolate: 'clamp',
        });

        const iconScale = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [1, 0.92, 0.84],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.swipeDeleteContainer}>
                <Animated.View
                    style={[
                        styles.swipeDeleteBackground,
                        {
                            opacity: bgOpacity,
                            transform: [{ translateX: actionTranslateX }],
                        },
                    ]}
                />
                <TouchableOpacity style={styles.swipeDeleteAction} onPress={onDelete} activeOpacity={0.8}>
                    <Animated.View style={{ opacity: bgOpacity, transform: [{ translateX: iconTranslateX }, { scale: iconScale }] }}>
                        <Feather name="trash-2" size={22} color={colors.white} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    };

    const content = (
        <View style={[styles.entryItem, { padding: rs(20, 0.84, 1) }, !isLast && styles.entryItemBorder]}>
            <View style={styles.entryLeft}>
                <View style={[styles.dateBox, { width: rs(48, 0.86, 1), height: rs(48, 0.86, 1), borderRadius: rs(24, 0.86, 1) }]}>
                    <Text style={[styles.dateWeekday, { fontSize: rfs(8, 0.92, 1) }]}>{entry.dayOfWeek.slice(0, 3).toUpperCase()}</Text>
                    <Text style={[styles.dateDay, { fontSize: rfs(12, 0.9, 1) }]}>{entry.dayOfMonth}</Text>
                </View>
                <View style={styles.entryDetails}>
                    <Text style={[styles.entryHours, { fontSize: rfs(16, 0.9, 1) }]}>{entry.totalHours} hrs</Text>
                    <Text style={[styles.entryMeta, { fontSize: rfs(10, 0.92, 1) }]}>{getTimeDisplay()}</Text>
                    {entry.tip > 0 ? (
                        <Text style={styles.entryTip}>+ ${entry.tip} tip</Text>
                    ) : null}
                </View>
            </View>
            <Text style={[styles.entryEarnings, { fontSize: rfs(16, 0.9, 1) }]}>${entry.totalEarnings.toFixed(0)}</Text>
        </View>
    );

    if (isLocked) {
        return content;
    }

    return (
        <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2} rightThreshold={40}>
            {content}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surfaceBright,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        marginHorizontal: spacing.md,
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
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
    menuItemDanger: {
        color: colors.secondaryContainer,
    },
    heroCard: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.xl,
        padding: spacing['3xl'],
        marginBottom: spacing.lg,
    },
    heroEyebrow: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    heroTitle: {
        color: colors.primary,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    heroSubcopy: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    summaryCard: {
        flex: 1,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.md,
    },
    summaryValue: {
        color: colors.white,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
    },
    summaryUnit: {
        fontSize: fontSizes.xl,
        opacity: 0.85,
    },
    weekGroup: {
        marginBottom: spacing.xl,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    weekTitle: {
        color: colors.primary,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    weekSubtitle: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.xs,
    },
    weekTotals: {
        alignItems: 'flex-end',
    },
    weekEarnings: {
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
    weekHours: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    overtimeBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.orangeBg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    overtimeLabel: {
        color: colors.secondaryContainer,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    overtimeMeta: {
        color: colors.secondary,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    overtimeValue: {
        color: colors.secondaryContainer,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
    entriesContainer: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
    },
    entryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
    },
    entryItemBorder: {
        marginBottom: 0,
    },
    entryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dateWeekday: {
        color: colors.outline,
        fontSize: 8,
        fontWeight: fontWeights.bold,
        letterSpacing: 0.6,
    },
    dateDay: {
        color: colors.onSurface,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    entryDetails: {
        flex: 1,
    },
    entryHours: {
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        marginBottom: 2,
    },
    entryMeta: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.xs,
    },
    entryTip: {
        color: colors.primary,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        marginTop: 4,
    },
    entryEarnings: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
        marginLeft: spacing.md,
    },
    swipeDeleteContainer: {
        width: 112,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    swipeDeleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 112,
        backgroundColor: colors.danger,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 22,
    },
    swipeDeleteAction: {
        width: 112,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing['4xl'],
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.lg,
    },
    emptyTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.sm,
    },
    emptyText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        textAlign: 'center',
        lineHeight: 22,
    },
});
