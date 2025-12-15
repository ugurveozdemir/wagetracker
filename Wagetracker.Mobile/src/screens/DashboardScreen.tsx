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
    Modal,
    Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../types';
import { useJobsStore, useAuthStore } from '../stores';
import { Card } from '../components/ui';
import { JobCard } from '../components/JobCard';
import { CreateJobModal } from '../components/CreateJobModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

type DashboardNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<DashboardNavigationProp>();
    const { summary, jobs, isLoading, error, fetchDashboard } = useJobsStore();
    const { logout } = useAuthStore();
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

    if (isLoading && !refreshing && !summary) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
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
                            Hi, <Text style={styles.greetingHighlight}>Creator!</Text> 👋
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

                    {/* Earnings Card */}
                    <Card variant="earnings" style={styles.statsCard}>
                        <View style={styles.statsHeader}>
                            <View style={styles.statsIcon}>
                                <Text style={styles.statsEmoji}>💰</Text>
                            </View>
                            <Text style={styles.statsLabel}>TOTAL EARNINGS</Text>
                        </View>
                        <Text style={styles.statsValue}>
                            {formatCurrency(summary?.totalEarnings || 0)}
                        </Text>
                        <Text style={styles.statsSubtext}>All time</Text>
                    </Card>

                    {/* Hours Card */}
                    <Card variant="hours" style={styles.statsCard}>
                        <View style={styles.statsHeader}>
                            <View style={styles.statsIcon}>
                                <Text style={styles.statsEmoji}>⏳</Text>
                            </View>
                            <Text style={styles.statsLabel}>TOTAL HOURS</Text>
                        </View>
                        <Text style={styles.statsValue}>
                            {summary?.totalHours?.toFixed(1) || '0.0'}
                            <Text style={styles.statsUnit}>h</Text>
                        </Text>
                        <Text style={styles.statsSubtext}>Across all jobs</Text>
                    </Card>
                </View>

                {/* My Jobs Section */}
                <View style={styles.jobsSection}>
                    <Text style={styles.sectionTitle}>My Jobs</Text>

                    {jobs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No jobs created yet.</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setIsModalOpen(true)}
                            >
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

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

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

    // Bento Grid
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

    // Empty State
    emptyState: {
        alignItems: 'center',
        padding: spacing['3xl'],
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        borderWidth: 2,
        borderColor: colors.slate200,
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
        marginBottom: spacing.lg,
    },
    emptyButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius['3xl'],
    },
    emptyButtonText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
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
