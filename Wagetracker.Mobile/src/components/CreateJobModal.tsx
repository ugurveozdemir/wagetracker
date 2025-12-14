import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import { useJobsStore } from '../stores';
import { Button, Input } from './ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const DAYS_OF_WEEK = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
];

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
    visible,
    onClose,
    onCreated,
}) => {
    const { createJob, isCreating } = useJobsStore();

    const [title, setTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(1); // Default Monday
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Job name is required');
            return;
        }
        if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
            setError('Please enter a valid hourly rate');
            return;
        }

        try {
            await createJob({
                title: title.trim(),
                hourlyRate: parseFloat(hourlyRate),
                firstDayOfWeek,
            });
            // Reset form
            setTitle('');
            setHourlyRate('');
            setFirstDayOfWeek(1);
            setError(null);
            onCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create job');
        }
    };

    const handleClose = () => {
        setTitle('');
        setHourlyRate('');
        setFirstDayOfWeek(1);
        setError(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>New Job 💼</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Text style={styles.closeIcon}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Form */}
                        <View style={styles.form}>
                            <Input
                                label="Job / Client Name"
                                placeholder="e.g. Design Studio"
                                value={title}
                                onChangeText={setTitle}
                                autoCapitalize="words"
                            />

                            <Input
                                label="Hourly Rate ($)"
                                placeholder="0"
                                value={hourlyRate}
                                onChangeText={setHourlyRate}
                                keyboardType="decimal-pad"
                            />

                            {/* Day of Week Selector */}
                            <View style={styles.daySection}>
                                <Text style={styles.dayLabel}>FIRST DAY OF WEEK</Text>
                                <Text style={styles.dayHint}>Used to calculate weekly overtime/totals.</Text>
                                <View style={styles.daysGrid}>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <TouchableOpacity
                                            key={day.id}
                                            style={[
                                                styles.dayButton,
                                                firstDayOfWeek === day.id && styles.dayButtonActive,
                                            ]}
                                            onPress={() => setFirstDayOfWeek(day.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayButtonText,
                                                    firstDayOfWeek === day.id && styles.dayButtonTextActive,
                                                ]}
                                            >
                                                {day.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Submit Button */}
                            <Button
                                title="Create Job"
                                onPress={handleSubmit}
                                loading={isCreating}
                                size="lg"
                                fullWidth
                            />
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius['3xl'],
        borderTopRightRadius: borderRadius['3xl'],
        padding: spacing.xl,
        paddingBottom: spacing['4xl'],
        maxHeight: '90%',
    },
    handleBar: {
        width: 64,
        height: 6,
        backgroundColor: colors.slate200,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: spacing.xl,
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 24,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        lineHeight: 26,
    },
    errorContainer: {
        backgroundColor: colors.orangeBg,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.orange,
        fontWeight: fontWeights.semibold,
        fontSize: fontSizes.sm,
    },
    form: {
        gap: spacing.md,
    },
    daySection: {
        marginBottom: spacing.lg,
    },
    dayLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        marginLeft: spacing.sm,
    },
    dayHint: {
        fontSize: fontSizes.xs,
        color: colors.slate400,
        marginBottom: spacing.md,
        marginLeft: spacing.sm,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    dayButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius['2xl'],
        backgroundColor: colors.slate50,
        borderWidth: 2,
        borderColor: colors.transparent,
    },
    dayButtonActive: {
        backgroundColor: colors.primaryLight + '20',
        borderColor: colors.primaryLight,
    },
    dayButtonText: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
    },
    dayButtonTextActive: {
        color: colors.primary,
    },
});
