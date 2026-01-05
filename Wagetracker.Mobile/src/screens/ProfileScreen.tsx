import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

type ProfileNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        Toast.show({
            type: 'info',
            text1: 'Signed Out',
            text2: 'See you next time!',
            visibilityTime: 2000,
        });
    };

    // Format member since date
    const formatMemberSince = () => {
        // For now, we'll show a placeholder since we don't have createdAt in user
        return 'Dec 2025';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
                    <View style={styles.memberBadge}>
                        <Text style={styles.memberText}>Member since {formatMemberSince()}</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ SETTINGS</Text>
                    <View style={styles.sectionContent}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <Text style={styles.settingIcon}>🌙</Text>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={false}
                                onValueChange={() => {
                                    Toast.show({
                                        type: 'info',
                                        text1: 'Coming Soon',
                                        text2: 'Dark mode will be available soon!',
                                        visibilityTime: 2000,
                                    });
                                }}
                                trackColor={{ false: colors.slate200, true: colors.primaryLight }}
                                thumbColor={colors.white}
                            />
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                Toast.show({
                                    type: 'info',
                                    text1: 'Coming Soon',
                                    text2: 'Currency selection will be available soon!',
                                    visibilityTime: 2000,
                                });
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <Text style={styles.settingIcon}>💱</Text>
                                <Text style={styles.settingLabel}>Currency</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>USD</Text>
                                <Text style={styles.chevron}>→</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔐 ACCOUNT</Text>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                Toast.show({
                                    type: 'info',
                                    text1: 'Coming Soon',
                                    text2: 'Password change will be available soon!',
                                    visibilityTime: 2000,
                                });
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <Text style={styles.settingIcon}>🔑</Text>
                                <Text style={styles.settingLabel}>Change Password</Text>
                            </View>
                            <Text style={styles.chevron}>→</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.signOutIcon}>🚪</Text>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.version}>WageTracker v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
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
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    backIcon: {
        fontSize: 20,
        color: colors.slate700,
    },
    headerTitle: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: spacing['4xl'],
    },

    // Profile Card
    profileCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xl,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight + '30',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 3,
        borderColor: colors.primary,
    },
    avatarText: {
        fontSize: 40,
    },
    userName: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.xs,
    },
    userEmail: {
        fontSize: fontSizes.base,
        color: colors.slate500,
        marginBottom: spacing.md,
    },
    memberBadge: {
        backgroundColor: colors.slate100,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    memberText: {
        fontSize: fontSizes.sm,
        color: colors.slate500,
        fontWeight: fontWeights.medium,
    },

    // Sections
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    sectionContent: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    // Setting Rows
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    settingIcon: {
        fontSize: fontSizes.xl,
    },
    settingLabel: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate700,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    settingValue: {
        fontSize: fontSizes.base,
        color: colors.slate400,
    },
    chevron: {
        fontSize: fontSizes.lg,
        color: colors.slate300,
    },
    divider: {
        height: 1,
        backgroundColor: colors.slate100,
        marginHorizontal: spacing.lg,
    },

    // Sign Out Button
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        paddingVertical: spacing.lg,
        gap: spacing.md,
        marginBottom: spacing.xl,
        borderWidth: 2,
        borderColor: colors.danger,
    },
    signOutIcon: {
        fontSize: fontSizes.xl,
    },
    signOutText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.danger,
    },

    // Version
    version: {
        textAlign: 'center',
        fontSize: fontSizes.sm,
        color: colors.slate400,
    },
});
