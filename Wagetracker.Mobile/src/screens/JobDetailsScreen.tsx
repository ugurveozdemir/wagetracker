import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Alert,
    Modal,
    Pressable,
    Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { MainStackParamList, WeeklyGroupResponse, EntryResponse } from '../types';
import { useEntriesStore, useJobsStore } from '../stores';
import { Card } from '../components/ui';
import { AddEntryModal } from '../components/AddEntryModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

type JobDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'JobDetails'>;
type JobDetailsRouteProp = RouteProp<MainStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC = () => {
    const navigation = useNavigation<JobDetailsNavigationProp>();
    const route = useRoute<JobDetailsRouteProp>();
    const { jobId } = route.params;

    const { jobDetails, weeks, isLoading, fetchJobDetails, deleteEntry, clearJobDetails } = useEntriesStore();
    const { fetchDashboard, deleteJob } = useJobsStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    useEffect(() => {
        fetchJobDetails(jobId);
        return () => clearJobDetails();
    }, [jobId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobDetails(jobId);
        setRefreshing(false);
    }, [jobId, fetchJobDetails]);

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
                        } catch (err) {
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
                                text2: `${job?.title} has been removed`,
                                visibilityTime: 2000,
                            });
                            fetchDashboard();
                            navigation.goBack();
                        } catch (err) {
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
            maximumFractionDigits: 0
        })}`;
    };

    const formatDate = (dateStr: string, format: 'weekday' | 'full') => {
        const date = new Date(dateStr);
        if (format === 'weekday') {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading && !refreshing && !jobDetails) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const job = jobDetails?.job;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{job?.title}</Text>
                <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => setShowOptionsMenu(true)}
                >
                    <Text style={styles.optionsIcon}>⋮</Text>
                </TouchableOpacity>
            </View>

            {/* Options Menu Modal */}
            <Modal
                visible={showOptionsMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <Pressable
                    style={styles.menuOverlay}
                    onPress={() => setShowOptionsMenu(false)}
                >
                    <Pressable style={styles.menuContainer}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleDeleteJob}
                        >
                            <Text style={styles.menuItemIcon}>🗑️</Text>
                            <Text style={styles.menuItemTextDanger}>Delete Job</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <Card variant="earnings" style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIcon}>
                                <Text style={styles.summaryIconText}>$</Text>
                            </View>
                            <Text style={styles.summaryLabel}>EARNED</Text>
                        </View>
                        <Text style={styles.summaryValue}>
                            {formatCurrency(job?.totalEarnings || 0)}
                        </Text>
                    </Card>

                    <Card variant="hours" style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIcon}>
                                <Text style={styles.summaryIconText}>⏱</Text>
                            </View>
                            <Text style={styles.summaryLabel}>HOURS</Text>
                        </View>
                        <Text style={styles.summaryValue}>
                            {job?.totalHours?.toFixed(1) || '0.0'}
                            <Text style={styles.summaryUnit}>h</Text>
                        </Text>
                    </Card>
                </View>

                {/* Weekly Groups */}
                {weeks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No entries yet. Tap + to add hours.</Text>
                    </View>
                ) : (
                    weeks.map((week, index) => (
                        <WeekGroupComponent
                            key={index}
                            week={week}
                            onDeleteEntry={handleDeleteEntry}
                        />
                    ))
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Entry Modal */}
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
        </SafeAreaView>
    );
};

// Week Group Component
interface WeekGroupProps {
    week: WeeklyGroupResponse;
    onDeleteEntry: (id: number) => void;
}

const WeekGroupComponent: React.FC<WeekGroupProps> = ({ week, onDeleteEntry }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(0)}`;
    };

    return (
        <View style={styles.weekGroup}>
            {/* Week Header */}
            <View style={styles.weekHeader}>
                <View>
                    <Text style={styles.weekTitle}>WEEK OF {formatDate(week.weekStart).toUpperCase()}</Text>
                    <Text style={styles.weekSubtitle}>To {formatDate(week.weekEnd)}</Text>
                </View>
                <View style={styles.weekTotals}>
                    <Text style={styles.weekEarnings}>{formatCurrency(week.totalEarnings)}</Text>
                    <Text style={styles.weekHours}>{week.totalHours.toFixed(1)}h</Text>
                </View>
            </View>

            {/* Overtime Banner */}
            {week.overtimeHours > 0 && (
                <View style={styles.overtimeBanner}>
                    <View style={styles.overtimeLeft}>
                        <Text style={styles.overtimeIcon}>🔥</Text>
                        <Text style={styles.overtimeLabel}>OVERTIME BONUS</Text>
                    </View>
                    <Text style={styles.overtimeValue}>
                        +{week.overtimeHours.toFixed(1)}h <Text style={styles.overtimeBonus}>({formatCurrency(week.overtimeBonus)})</Text>
                    </Text>
                </View>
            )}

            {/* Entries */}
            <View style={styles.entriesContainer}>
                {week.entries.map((entry, idx) => (
                    <EntryItem
                        key={entry.id}
                        entry={entry}
                        isLast={idx === week.entries.length - 1}
                        onDelete={() => onDeleteEntry(entry.id)}
                    />
                ))}
            </View>
        </View>
    );
};

// Entry Item Component
interface EntryItemProps {
    entry: EntryResponse;
    isLast: boolean;
    onDelete: () => void;
}

const EntryItem: React.FC<EntryItemProps> = ({ entry, isLast, onDelete }) => {
    const formatTime = (time: string | null) => {
        if (!time) return null;
        // Handle TimeSpan format (HH:mm:ss) vs time string
        const parts = time.split(':');
        const hours = parseInt(parts[0]);
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
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-100, -50, 0],
            outputRange: [1, 0.8, 0],
            extrapolate: 'clamp',
        });

        const opacity = dragX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity
                style={styles.swipeDeleteAction}
                onPress={onDelete}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ scale }], opacity }}>
                    <Text style={styles.swipeDeleteIcon}>🗑️</Text>
                    <Text style={styles.swipeDeleteText}>Delete</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
        >
            <View style={[styles.entryItem, !isLast && styles.entryItemBorder]}>
                <View style={styles.entryLeft}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateWeekday}>{entry.dayOfWeek.slice(0, 3).toUpperCase()}</Text>
                        <Text style={styles.dateDay}>{entry.dayOfMonth}</Text>
                    </View>
                    <View style={styles.entryDetails}>
                        <View style={styles.entryHoursRow}>
                            <Text style={styles.entryHours}>{entry.totalHours} hrs</Text>
                            {entry.hasOvertime && (
                                <View style={styles.overtimeBadge}>
                                    <Text style={styles.overtimeBadgeText}>1.5x</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.entryMeta}>
                            <Text style={styles.entryTime}>{getTimeDisplay()}</Text>
                            {entry.tip > 0 && (
                                <Text style={styles.entryTip}>• ${entry.tip} tip</Text>
                            )}
                            {entry.overtimeHours > 0 && (
                                <Text style={styles.entryOT}>• {entry.overtimeHours.toFixed(1)}h OT</Text>
                            )}
                        </View>
                    </View>
                </View>
                <Text style={styles.entryEarnings}>${entry.totalEarnings.toFixed(0)}</Text>
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.slate50,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 100,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.slate50,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: colors.slate700,
    },
    headerTitle: {
        flex: 1,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        textAlign: 'center',
        marginHorizontal: spacing.md,
    },
    headerSpacer: {
        width: 40,
    },
    optionsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionsIcon: {
        fontSize: 24,
        fontWeight: fontWeights.bold,
        color: colors.slate700,
    },

    // Options Menu
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: spacing.lg,
    },
    menuContainer: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        minWidth: 160,
        overflow: 'hidden',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    menuItemIcon: {
        fontSize: fontSizes.lg,
    },
    menuItemTextDanger: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.orange,
    },

    // Summary Cards
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    summaryCard: {
        flex: 1,
        padding: spacing.lg,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    summaryIcon: {
        padding: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: borderRadius.full,
    },
    summaryIconText: {
        fontSize: fontSizes.sm,
        color: 'rgba(255,255,255,0.9)',
    },
    summaryLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    summaryValue: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.white,
    },
    summaryUnit: {
        fontSize: fontSizes.xl,
        opacity: 0.8,
    },

    // Week Group
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
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.primary,
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    weekSubtitle: {
        fontSize: fontSizes.xs,
        color: colors.slate400,
        fontWeight: fontWeights.medium,
    },
    weekTotals: {
        alignItems: 'flex-end',
    },
    weekEarnings: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    weekHours: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
        color: colors.slate400,
    },

    // Overtime Banner
    overtimeBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.orangeBg,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.orangeLight,
    },
    overtimeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    overtimeIcon: {
        fontSize: fontSizes.sm,
    },
    overtimeLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.orange,
        letterSpacing: 0.5,
    },
    overtimeValue: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        color: colors.orange,
    },
    overtimeBonus: {
        opacity: 0.6,
    },

    // Entries Container
    entriesContainer: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        overflow: 'hidden',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    entryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    entryItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.slate50,
    },
    entryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateBox: {
        width: 44,
        height: 44,
        borderRadius: borderRadius['2xl'],
        backgroundColor: colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dateWeekday: {
        fontSize: 8,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        letterSpacing: 0.5,
    },
    dateDay: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    entryDetails: {
        flex: 1,
    },
    entryHoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    entryHours: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate700,
    },
    overtimeBadge: {
        backgroundColor: colors.orangeLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.orange,
    },
    overtimeBadgeText: {
        fontSize: 8,
        fontWeight: fontWeights.extrabold,
        color: colors.orange,
    },
    entryMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    entryTime: {
        fontSize: fontSizes.xs,
        color: colors.slate400,
        fontWeight: fontWeights.medium,
    },
    entryTip: {
        fontSize: fontSizes.xs,
        color: colors.emerald,
        fontWeight: fontWeights.bold,
    },
    entryOT: {
        fontSize: fontSizes.xs,
        color: colors.orange,
        fontWeight: fontWeights.medium,
    },
    entryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    entryEarnings: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteIcon: {
        fontSize: fontSizes.base,
        opacity: 0.5,
    },
    swipeDeleteAction: {
        backgroundColor: colors.orange,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    swipeDeleteIcon: {
        fontSize: fontSizes.xl,
        marginBottom: spacing.xs,
    },
    swipeDeleteText: {
        color: colors.white,
        fontWeight: fontWeights.bold,
        fontSize: fontSizes.xs,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        padding: spacing['3xl'],
    },
    emptyText: {
        fontSize: fontSizes.base,
        color: colors.slate400,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.slate900,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        fontWeight: fontWeights.bold,
        color: colors.white,
        lineHeight: 34,
    },
});
