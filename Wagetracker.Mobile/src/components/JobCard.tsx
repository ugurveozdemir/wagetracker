import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { JobResponse } from '../types';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme';

interface JobCardProps {
    job: JobResponse;
    onPress: () => void;
    style?: ViewStyle;
    variant?: 'green' | 'blue';
}

const paletteByVariant = {
    green: {
        surface: '#005232',
        glow: 'rgba(255,255,255,0.10)',
        badge: 'rgba(255,255,255,0.20)',
        badgeText: colors.white,
        title: colors.white,
        subtitle: 'rgba(255,255,255,0.80)',
        earnings: colors.white,
        chevron: 'rgba(255,255,255,0.20)',
        chevronText: colors.white,
    },
    blue: {
        surface: '#00429B',
        glow: 'rgba(255,255,255,0.10)',
        badge: 'rgba(255,255,255,0.20)',
        badgeText: colors.white,
        title: colors.white,
        subtitle: 'rgba(255,255,255,0.82)',
        earnings: colors.white,
        chevron: 'rgba(255,255,255,0.20)',
        chevronText: colors.white,
    },
} as const;

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, style, variant = 'green' }) => {
    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const palette = paletteByVariant[variant];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: palette.surface }, style]}
            onPress={onPress}
            activeOpacity={0.78}
        >
            <View style={[styles.glow, { backgroundColor: palette.glow }]} />

            <View style={styles.content}>
                <View style={[styles.badge, { backgroundColor: palette.badge }]}>
                    <Text style={[styles.badgeText, { color: palette.badgeText }]}>Active Gig</Text>
                </View>

                <Text style={[styles.title, { color: palette.title }]} numberOfLines={1}>
                    {job.title}
                </Text>

                <Text style={[styles.subtitle, { color: palette.subtitle }]}>
                    ${job.hourlyRate}/hr  |  {job.totalHours.toFixed(0)}h total
                </Text>
            </View>

            <View style={styles.rightSection}>
                <Text style={[styles.earnings, { color: palette.earnings }]}>
                    {formatCurrency(job.totalEarnings)}
                </Text>

                <View style={[styles.chevron, { backgroundColor: palette.chevron }]}>
                    <Text style={[styles.chevronText, { color: palette.chevronText }]}>›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing['2xl'],
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 6,
    },
    glow: {
        position: 'absolute',
        right: -16,
        top: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    content: {
        flex: 1,
        marginRight: spacing.md,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    badgeText: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    title: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    earnings: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
    },
    chevron: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronText: {
        fontSize: 24,
        fontWeight: fontWeights.bold,
    },
});
