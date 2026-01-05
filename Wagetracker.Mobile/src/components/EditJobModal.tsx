import React, { useState, useRef, useEffect } from 'react';
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
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 10;
            },
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
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.content,
                        { transform: [{ translateY }] }
                    ]}
                >
                    {/* Swipe Handle */}
                    <View {...panResponder.panHandlers} style={styles.handleArea}>
                        <View style={styles.handleBar} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Job ✏️</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAwareScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        enableOnAndroid={true}
                        extraScrollHeight={40}
                        extraHeight={60}
                    >
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
                                title="Save Changes"
                                onPress={handleSubmit}
                                loading={isUpdating}
                                size="lg"
                                fullWidth
                            />
                        </View>
                    </KeyboardAwareScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius['3xl'],
        borderTopRightRadius: borderRadius['3xl'],
        maxHeight: '75%',
    },
    handleArea: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    handleBar: {
        width: 48,
        height: 5,
        backgroundColor: colors.slate300,
        borderRadius: 3,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['4xl'],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 22,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        lineHeight: 24,
    },
    errorContainer: {
        backgroundColor: colors.orangeBg,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.orange,
        fontWeight: fontWeights.semibold,
        fontSize: fontSizes.sm,
    },
    form: {
        gap: spacing.sm,
    },
    daySection: {
        marginBottom: spacing.md,
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
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.xl,
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
