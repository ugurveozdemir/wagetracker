import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../stores';
import { colors, spacing, fontSizes, fontWeights, borderRadius, useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

type ProfileNavigationProp = any;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, logout } = useAuthStore();
    const { isCompact, horizontalPadding, panelRadius, rs } = useResponsiveLayout();

    const handleLogout = async () => {
        await logout();
        Toast.show({
            type: 'info',
            text1: 'Signed Out',
            text2: 'See you next time.',
            visibilityTime: 2000,
        });
    };

    const showComingSoon = (title: string, text2: string) => {
        Toast.show({
            type: 'info',
            text1: title,
            text2,
            visibilityTime: 2000,
        });
    };

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
                <Text style={[styles.headerTitle, { fontSize: isCompact ? 20 : fontSizes.xl }]}>Profile</Text>
                <View style={[styles.headerSpacer, { width: rs(42) }]} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingHorizontal: horizontalPadding, paddingBottom: rs(120) },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.heroCard, { borderRadius: panelRadius, padding: rs(32) }]}>
                    <View
                        style={[
                            styles.avatarContainer,
                            { width: rs(86), height: rs(86), borderRadius: rs(43) },
                        ]}
                    >
                        <Text style={[styles.avatarText, { fontSize: isCompact ? 28 : 32 }]}>
                            {(user?.fullName || 'U').slice(0, 1).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.userName, { fontSize: isCompact ? 24 : fontSizes['2xl'] }]}>{user?.fullName || 'User'}</Text>
                    <Text style={[styles.userEmail, { fontSize: isCompact ? 15 : fontSizes.base }]}>{user?.email || 'email@example.com'}</Text>
                    <View style={[styles.memberBadge, { borderRadius: rs(999), paddingHorizontal: rs(18), paddingVertical: rs(10) }]}>
                        <Text style={styles.memberText}>Member since Dec 2025</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={[styles.sectionContent, { borderRadius: rs(24) }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={styles.settingIconWrap}>
                                    <Feather name="moon" size={16} color={colors.primary} />
                                </View>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={false}
                                onValueChange={() =>
                                    showComingSoon('Coming Soon', 'Dark mode will be available soon.')
                                }
                                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primarySoft }}
                                thumbColor={colors.surfaceContainerLowest}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => showComingSoon('Coming Soon', 'Currency selection will be available soon.')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.settingLeft}>
                                <View style={styles.settingIconWrap}>
                                    <Feather name="dollar-sign" size={16} color={colors.primary} />
                                </View>
                                <Text style={styles.settingLabel}>Currency</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>USD</Text>
                                <Feather name="chevron-right" size={16} color={colors.outline} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={[styles.sectionContent, { borderRadius: rs(24) }]}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => showComingSoon('Coming Soon', 'Password change will be available soon.')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.settingLeft}>
                                <View style={styles.settingIconWrap}>
                                    <Feather name="lock" size={16} color={colors.primary} />
                                </View>
                                <Text style={styles.settingLabel}>Change Password</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color={colors.outline} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.signOutButton, { borderRadius: rs(24), paddingVertical: rs(18) }]}
                    onPress={handleLogout}
                    activeOpacity={0.84}
                >
                    <Feather name="log-out" size={18} color={colors.secondaryContainer} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>WageTracker v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
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
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
    },
    headerSpacer: {
        width: 42,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    heroCard: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.xl,
        padding: spacing['3xl'],
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: colors.surfaceContainerLowest,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        color: colors.primary,
        fontSize: 32,
        fontWeight: fontWeights.extrabold,
    },
    userName: {
        color: colors.onSurface,
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    userEmail: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        marginBottom: spacing.md,
    },
    memberBadge: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    memberText: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    sectionContent: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    settingValue: {
        color: colors.outline,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        marginBottom: spacing.xl,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
    },
    signOutText: {
        color: colors.secondaryContainer,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    version: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        textAlign: 'center',
    },
});
