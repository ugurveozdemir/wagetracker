import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { JobResponse } from '../types';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme';

interface JobCardProps {
    job: JobResponse;
    onPress: () => void;
    style?: ViewStyle;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, style }) => {
    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.78}
        >
            <View style={styles.glow} />
            <View style={styles.content}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Active Gig</Text>
                </View>
                <Text style={styles.title} numberOfLines={1}>
                    {job.title}
                </Text>
                <Text style={styles.subtitle}>
                    ${job.hourlyRate}/hr  •  {job.totalHours.toFixed(0)}h total
                </Text>
            </View>

            <View style={styles.rightSection}>
                <Text style={styles.earnings}>{formatCurrency(job.totalEarnings)}</Text>
                <View style={styles.chevron}>
                    <Text style={styles.chevronText}>›</Text>
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
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.06,
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
        backgroundColor: 'rgba(0, 109, 68, 0.08)',
    },
    content: {
        flex: 1,
        marginRight: spacing.md,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0, 109, 68, 0.08)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    badgeText: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    title: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        color: colors.onSurface,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
        color: colors.onSurfaceVariant,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    earnings: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.primary,
    },
    chevron: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: fontWeights.bold,
    },
});
