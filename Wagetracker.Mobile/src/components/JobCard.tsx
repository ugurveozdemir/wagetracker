import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle
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
            maximumFractionDigits: 0
        })}`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.subtitle}>
                    ${job.hourlyRate}/hr • {job.totalHours.toFixed(0)}h total
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
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius['3xl'],
        borderWidth: 2,
        borderColor: colors.slate100,
        marginBottom: spacing.md,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    content: {
        flex: 1,
        marginRight: spacing.md,
    },
    title: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
        color: colors.slate400,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    earnings: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    chevron: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronText: {
        fontSize: 24,
        color: colors.slate400,
        fontWeight: fontWeights.bold,
    },
});
