import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    PanResponder,
    Dimensions,
    Keyboard,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useJobsStore } from '../stores';
import { Button, Input } from './ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { JobResponse } from '../types';
import Toast from 'react-native-toast-message';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 150;

interface EditJobModalProps {
    visible: boolean;
    job: JobResponse | null;
    onClose: () => void;
    onUpdated: () => void;
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

export const EditJobModal: React.FC<EditJobModalProps> = ({
    visible,
    job,
    onClose,
    onUpdated,
}) => {
    const { updateJob, isUpdating } = useJobsStore();
    const translateY = useRef(new Animated.Value(0)).current;

    const [title, setTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > DISMISS_THRESHOLD) {
                    Animated.timing(translateY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        translateY.setValue(0);
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible && job) {
            translateY.setValue(0);
            setTitle(job.title);
            setHourlyRate(job.hourlyRate.toString());
            setFirstDayOfWeek(job.firstDayOfWeek);
            setError(null);
        }
    }, [visible, job]);

    const handleSubmit = async () => {
        if (!job) return;

        Keyboard.dismiss();
        if (!title.trim()) {
            setError('Job name is required');
            return;
        }

        if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
            setError('Please enter a valid hourly rate');
            return;
        }

        try {
            await updateJob(job.id, {
                title: title.trim(),
                hourlyRate: parseFloat(hourlyRate),
                firstDayOfWeek,
            });
            Toast.show({
                type: 'success',
                text1: 'Job Updated',
                text2: `${title.trim()} has been updated`,
                visibilityTime: 2000,
            });
            onUpdated();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
            setError(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
                visibilityTime: 3000,
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
                    <View {...panResponder.panHandlers} style={styles.handleArea}>
                        <View style={styles.handleBar} />
                    </View>

                    <View style={styles.header}>
                        <View>
                            <Text style={styles.eyebrow}>Refine Role</Text>
                            <Text style={styles.title}>Edit Job</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                            <Feather name="x" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAwareScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        enableOnAndroid
                        extraScrollHeight={40}
                        extraHeight={60}
                    >
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.heroPanel}>
                            <Text style={styles.heroLabel}>Current Role</Text>
                            <Text style={styles.heroTitle}>{job?.title || 'Job'}</Text>
                        </View>

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

                        <View style={styles.daySection}>
                            <Text style={styles.dayLabel}>First Day of Week</Text>
                            <Text style={styles.dayHint}>Used for overtime and weekly summaries.</Text>
                            <View style={styles.daysGrid}>
                                {DAYS_OF_WEEK.map((day) => (
                                    <TouchableOpacity
                                        key={day.id}
                                        style={[
                                            styles.dayButton,
                                            firstDayOfWeek === day.id && styles.dayButtonActive,
                                        ]}
                                        onPress={() => setFirstDayOfWeek(day.id)}
                                        activeOpacity={0.82}
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

                        <Button
                            title="Save Changes"
                            onPress={handleSubmit}
                            loading={isUpdating}
                            size="lg"
                            fullWidth
                        />
                    </KeyboardAwareScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(24, 29, 25, 0.18)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.surfaceBright,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '82%',
    },
    handleArea: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    handleBar: {
        width: 48,
        height: 5,
        backgroundColor: colors.outlineVariant,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    eyebrow: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginBottom: 4,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.primary,
    },
    closeButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['4xl'],
    },
    errorContainer: {
        backgroundColor: colors.dangerBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.danger,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    heroPanel: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        marginBottom: spacing.lg,
    },
    heroLabel: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    heroTitle: {
        color: colors.primary,
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
    },
    daySection: {
        marginBottom: spacing.lg,
    },
    dayLabel: {
        color: colors.primary,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.xs,
        marginLeft: spacing.sm,
    },
    dayHint: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.xs,
        marginBottom: spacing.md,
        marginLeft: spacing.sm,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    dayButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceContainerHighest,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dayButtonActive: {
        backgroundColor: 'rgba(0, 109, 68, 0.10)',
        borderColor: 'rgba(0, 109, 68, 0.18)',
    },
    dayButtonText: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    dayButtonTextActive: {
        color: colors.primary,
    },
});
