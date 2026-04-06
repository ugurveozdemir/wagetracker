import React, { useEffect, useState, useCallback } from 'react';
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
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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

    useEffect(() => {
        fetchDashboard();
    }, []);

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
            text2: 'See you next time!',
            visibilityTime: 2000,
        });
    };

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    // Skeleton loading
    if (isLoading && !refreshing && !summary) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />
                <View style={styles.skeletonContainer}>
                    {/* Header skeleton */}
                    <View style={styles.skeletonHeader}>
                        <View style={[styles.skeletonBlock, { width: 180, height: 32, borderRadius: 8 }]} />
                        <View style={[styles.skeletonBlock, { width: 44, height: 44, borderRadius: 22 }]} />
                    </View>
                    {/* Today card skeleton */}
                    <View style={[styles.skeletonCard, { height: 160 }]} />
                    {/* Stats cards skeleton */}
                    <View style={[styles.skeletonCard, { height: 150, backgroundColor: colors.slate200 }]} />
                    <View style={[styles.skeletonCard, { height: 150, backgroundColor: colors.slate200 }]} />
                    {/* Section title skeleton */}
                    <View style={[styles.skeletonBlock, { width: 100, height: 24, marginTop: spacing.lg, marginBottom: spacing.md, borderRadius: 6 }]} />
                    {/* Job cards skeleton */}
                    <View style={[styles.skeletonCard, { height: 90 }]} />
                    <View style={[styles.skeletonCard, { height: 90 }]} />
                </View>
            </SafeAreaView>
        );
    }

    // Network error state with retry
    if (error && !summary && !isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />
                <View style={styles.errorStateContainer}>
                    <Text style={styles.errorStateEmoji}>📡</Text>
                    <Text style={styles.errorStateTitle}>Connection Error</Text>
                    <Text style={styles.errorStateMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchDashboard()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hi, <Text style={styles.greetingHighlight}>{user?.fullName?.split(' ')[0] || 'there'}!</Text> 👋
                        </Text>
                    </View>

                    {/* Profile Button */}
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => setShowProfileMenu(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.profileIcon}>👤</Text>
                    </TouchableOpacity>
                </View>

                {/* Bento Grid */}
                <View style={styles.bentoGrid}>
                    {/* Today Card */}
                    <Card style={styles.todayCard}>
                        <View style={styles.todayBadge}>
                            <Text style={styles.todayBadgeText}>TODAY</Text>
                        </View>
                        <Text style={styles.todayDay}>{dayName}.</Text>
                        <Text style={styles.todayDate}>{dateStr}</Text>
                        <View style={styles.todayFooter}>
                            <Text style={styles.activeJobsCount}>{summary?.activeJobsCount || 0}</Text>
                            <Text style={styles.activeJobsLabel}> active jobs</Text>
                        </View>
                    </Card>

                    {/* Weekly Stats Section */}
                    <Text style={styles.sectionTitleWeekly}>This Week</Text>

                    <View style={styles.weeklyGrid}>
                        {/* Weekly Net (Full Width) */}
                        <Card style={styles.weeklyNetCard}>
                            <View style={styles.statsHeader}>
                                <View style={[styles.statsIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Text style={styles.statsEmoji}>✨</Text>
                                </View>
                                <Text style={[styles.statsLabel, { color: colors.emerald }]}>WEEKLY NET</Text>
                            </View>
                            <Text style={[styles.statsValue, { color: colors.slate800 }]}>
                                {summary?.weeklyNet && summary.weeklyNet < 0 ? '-' : ''}
                                {formatCurrency(Math.abs(summary?.weeklyNet || 0))}
                            </Text>
                        </Card>

                        <View style={styles.weeklyRow}>
                            {/* Weekly Earnings */}
                            <Card variant="earnings" style={[styles.statsCard, { flex: 1, marginRight: spacing.sm }]}>
                                <View style={styles.statsHeader}>
                                    <View style={styles.statsIcon}>
                                        <Text style={styles.statsEmoji}>💰</Text>
                                    </View>
                                    <Text style={styles.statsLabel}>EARNINGS</Text>
                                </View>
                                <Text style={styles.statsValueSmall}>
                                    {formatCurrency(summary?.weeklyEarnings || 0)}
                                </Text>
                            </Card>

                            {/* Weekly Expenses */}
                            <View style={[styles.expenseCard, { flex: 1, marginLeft: spacing.sm }]}>
                                <View style={styles.statsHeader}>
                                    <View style={styles.statsIconLoss}>
                                        <Text style={styles.statsEmoji}>💸</Text>
                                    </View>
                                    <Text style={[styles.statsLabel, { color: 'rgba(239, 68, 68, 0.8)' }]}>EXPENSES</Text>
                                </View>
                                <Text style={[styles.statsValueSmall, { color: colors.white }]}>
                                    {formatCurrency(summary?.weeklyExpenses || 0)}
                                </Text>
                            </View>
                        </View>

                         {/* Hours Card */}
                        <Card variant="hours" style={styles.hoursCard}>
                            <View style={styles.statsHeader}>
                                <View style={styles.statsIcon}>
                                    <Text style={styles.statsEmoji}>⏳</Text>
                                </View>
                                <Text style={styles.statsLabel}>WEEKLY HOURS</Text>
                            </View>
                            <Text style={styles.statsValueSmall}>
                                {summary?.weeklyHours?.toFixed(1) || '0.0'}
                                <Text style={styles.statsUnit}>h</Text>
                            </Text>
                        </Card>
                    </View>
                </View>

                {/* My Jobs Section */}
                <View style={styles.jobsSection}>
                    <Text style={styles.sectionTitle}>My Jobs</Text>

                    {jobs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIllustration}>
                                <Text style={styles.emptyMainEmoji}>💼</Text>
                                <View style={styles.emptySparkles}>
                                    <Text style={styles.emptySparkle}>✨</Text>
                                    <Text style={[styles.emptySparkle, { top: -8, right: -4, fontSize: 14 }]}>✨</Text>
                                </View>
                            </View>
                            <Text style={styles.emptyTitle}>No jobs yet</Text>
                            <Text style={styles.emptyText}>Start tracking your earnings by{"\n"}creating your first job</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setIsModalOpen(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.emptyButtonIcon}>+</Text>
                                <Text style={styles.emptyButtonText}>Create your first job</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Create Job Modal */}
            <CreateJobModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={() => {
                    setIsModalOpen(false);
                    fetchDashboard();
                }}
            />

            {/* Profile Menu Modal */}
            <Modal
                visible={showProfileMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
            >
                <Pressable
                    style={styles.menuOverlay}
                    onPress={() => setShowProfileMenu(false)}
                >
                    <Pressable style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Account</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowProfileMenu(false);
                                (navigation as any).navigate('ProfileTab');
                            }}
                        >
                            <Text style={styles.menuItemIcon}>👤</Text>
                            <Text style={styles.menuItemText}>Profile</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLogout}
                        >
                            <Text style={styles.menuItemIcon}>🚪</Text>
                            <Text style={styles.menuItemText}>Sign Out</Text>
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
        backgroundColor: colors.slate50,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.slate50,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    greetingHighlight: {
        color: colors.primary,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    profileIcon: {
        fontSize: 20,
    },

    // Profile Menu
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
        minWidth: 180,
        overflow: 'hidden',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    menuHeader: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate100,
    },
    menuTitle: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    menuItemText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate700,
    },
    menuItemTextDisabled: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate400,
    },
    menuDivider: {
        height: 1,
        backgroundColor: colors.slate100,
        marginHorizontal: spacing.lg,
    },

    bentoGrid: {
        marginBottom: spacing.xl,
    },
    todayCard: {
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    todayBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.slate100,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
    },
    todayBadgeText: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        letterSpacing: 1,
    },
    todayDay: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    todayDate: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.semibold,
        color: colors.slate400,
        marginBottom: spacing.md,
    },
    todayFooter: {
        flexDirection: 'row',
        alignItems: 'baseline',
        borderTopWidth: 1,
        borderTopColor: colors.slate100,
        paddingTop: spacing.md,
    },
    activeJobsCount: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.primary,
    },
    activeJobsLabel: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        color: colors.slate500,
    },

    // Stats Cards
    statsCard: {
        marginBottom: spacing.md,
        minHeight: 150,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    statsIcon: {
        padding: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: borderRadius.xl,
    },
    statsEmoji: {
        fontSize: fontSizes.xl,
    },
    statsLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    statsValue: {
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.white,
    },
    statsUnit: {
        fontSize: fontSizes['3xl'],
        opacity: 0.8,
    },
    statsSubtext: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        color: 'rgba(255,255,255,0.7)',
        marginTop: spacing.xs,
    },

    // Jobs Section
    jobsSection: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.md,
        paddingLeft: spacing.sm,
    },

    // Skeleton Loading
    skeletonContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    skeletonBlock: {
        backgroundColor: colors.slate200,
        borderRadius: borderRadius.xl,
    },
    skeletonCard: {
        backgroundColor: colors.slate100,
        borderRadius: borderRadius['3xl'],
        marginBottom: spacing.md,
        height: 120,
    },

    // Error State
    errorStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing['3xl'],
    },
    errorStateEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    errorStateTitle: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.sm,
    },
    errorStateMessage: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['3xl'],
        borderRadius: borderRadius['3xl'],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['4xl'],
        paddingHorizontal: spacing['3xl'],
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        borderWidth: 2,
        borderColor: colors.slate200,
        borderStyle: 'dashed',
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyMainEmoji: {
        fontSize: 48,
    },
    emptySparkles: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    emptySparkle: {
        fontSize: 18,
        position: 'absolute',
    },
    emptyTitle: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius['3xl'],
        gap: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonIcon: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },
    emptyButtonText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },

    sectionTitleWeekly: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.md,
        paddingLeft: spacing.sm,
        marginTop: spacing.md,
    },
    weeklyGrid: {
        gap: spacing.sm,
    },
    weeklyRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    weeklyNetCard: {
        marginBottom: spacing.sm,
        padding: spacing.lg,
    },
    hoursCard: {
        padding: spacing.lg,
    },
    expenseCard: {
        backgroundColor: '#ef4444',
        borderRadius: borderRadius['3xl'],
        padding: spacing.lg,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
    },
    statsIconLoss: {
        padding: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: borderRadius.xl,
    },
    statsValueSmall: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.white,
    },
});
