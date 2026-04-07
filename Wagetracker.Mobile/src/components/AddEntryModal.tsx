import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    Animated,
    PanResponder,
    Dimensions,
    Keyboard,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEntriesStore } from '../stores';
import { Button, Input } from './ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 150;

interface AddEntryModalProps {
    visible: boolean;
    jobId: number;
    onClose: () => void;
    onCreated: () => void;
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
    visible,
    jobId,
    onClose,
    onCreated,
}) => {
    const { createEntry, isCreating } = useEntriesStore();
    const translateY = useRef(new Animated.Value(0)).current;

    const [entryMode, setEntryMode] = useState<'total' | 'time'>('total');
    const [date, setDate] = useState(new Date());
    const [hours, setHours] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [tip, setTip] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

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
        if (visible) {
            translateY.setValue(0);
            setDate(new Date());
            setHours('');
            const now = new Date();
            const startDefault = new Date(now);
            startDefault.setHours(9, 0, 0, 0);
            const endDefault = new Date(now);
            endDefault.setHours(17, 0, 0, 0);
            setStartTime(startDefault);
            setEndTime(endDefault);
            setTip('');
            setError(null);
            setEntryMode('total');
            setShowDatePicker(false);
            setShowStartPicker(false);
            setShowEndPicker(false);
        }
    }, [visible]);

    const calculateDuration = () => {
        const diff = (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
        return diff < 0 ? diff + 24 : diff;
    };

    const formatTime = (time: Date) => {
        return time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const formatTimeForApi = (time: Date) => {
        const hoursValue = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hoursValue}:${minutes}:00`;
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();
        let totalHours: number | null = null;
        let startTimeStr: string | null = null;
        let endTimeStr: string | null = null;

        if (entryMode === 'total') {
            if (!hours || parseFloat(hours) <= 0) {
                setError('Please enter valid hours');
                return;
            }
            totalHours = parseFloat(hours);
        } else {
            startTimeStr = formatTimeForApi(startTime);
            endTimeStr = formatTimeForApi(endTime);
            totalHours = calculateDuration();
            if (totalHours <= 0) {
                setError('End time must be after start time');
                return;
            }
        }

        try {
            await createEntry({
                jobId,
                date: date.toISOString().split('T')[0],
                startTime: startTimeStr,
                endTime: endTimeStr,
                totalHours,
                tip: tip ? parseFloat(tip) : 0,
                note: null,
            });

            Toast.show({
                type: 'success',
                text1: 'Entry Added',
                text2: `${totalHours?.toFixed(1)} hours recorded successfully`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create entry';
            setError(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
                visibilityTime: 3000,
            });
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onStartTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
        }
        if (selectedTime) {
            setStartTime(selectedTime);
        }
    };

    const onEndTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowEndPicker(false);
        }
        if (selectedTime) {
            setEndTime(selectedTime);
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
                            <Text style={styles.eyebrow}>Shift Capture</Text>
                            <Text style={styles.title}>Add Entry</Text>
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
                        <View style={styles.heroPanel}>
                            <Text style={styles.heroLabel}>Locked Rate</Text>
                            <Text style={styles.heroTitle}>Record today’s shift with the same backend calculation rules.</Text>
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowStartPicker(false);
                                    setShowEndPicker(false);
                                    setShowDatePicker(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dateButtonText}>
                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                                <Feather name="calendar" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && Platform.OS === 'ios' && (
                            <View style={styles.pickerContainerDark}>
                                <View style={styles.pickerHeaderDark}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.pickerDoneLight}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="inline"
                                    onChange={onDateChange}
                                    themeVariant="dark"
                                />
                            </View>
                        )}

                        {showDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="calendar"
                                onChange={onDateChange}
                            />
                        )}

                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[styles.modeButton, entryMode === 'total' && styles.modeButtonActive]}
                                onPress={() => setEntryMode('total')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.modeButtonText,
                                        entryMode === 'total' && styles.modeButtonTextActive,
                                    ]}
                                >
                                    Total Hours
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeButton, entryMode === 'time' && styles.modeButtonActive]}
                                onPress={() => setEntryMode('time')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.modeButtonText,
                                        entryMode === 'time' && styles.modeButtonTextActive,
                                    ]}
                                >
                                    Start / End
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {entryMode === 'total' ? (
                            <Input
                                label="Duration (Hours)"
                                placeholder="8.5"
                                value={hours}
                                onChangeText={setHours}
                                keyboardType="decimal-pad"
                            />
                        ) : (
                            <>
                                <View style={styles.timeRow}>
                                    <View style={styles.timeInput}>
                                        <Text style={styles.label}>Start</Text>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setShowDatePicker(false);
                                                setShowEndPicker(false);
                                                setShowStartPicker(true);
                                            }}
                                        >
                                            <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.timeInput}>
                                        <Text style={styles.label}>End</Text>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setShowDatePicker(false);
                                                setShowStartPicker(false);
                                                setShowEndPicker(true);
                                            }}
                                        >
                                            <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {showStartPicker && Platform.OS === 'ios' && (
                                    <View style={styles.pickerContainerDark}>
                                        <View style={styles.pickerHeaderDark}>
                                            <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                                                <Text style={styles.pickerDoneLight}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <DateTimePicker
                                            value={startTime}
                                            mode="time"
                                            display="spinner"
                                            onChange={onStartTimeChange}
                                            style={styles.picker}
                                            themeVariant="dark"
                                        />
                                    </View>
                                )}

                                {showStartPicker && Platform.OS === 'android' && (
                                    <DateTimePicker
                                        value={startTime}
                                        mode="time"
                                        display="default"
                                        onChange={onStartTimeChange}
                                    />
                                )}

                                {showEndPicker && Platform.OS === 'ios' && (
                                    <View style={styles.pickerContainerDark}>
                                        <View style={styles.pickerHeaderDark}>
                                            <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                                                <Text style={styles.pickerDoneLight}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <DateTimePicker
                                            value={endTime}
                                            mode="time"
                                            display="spinner"
                                            onChange={onEndTimeChange}
                                            style={styles.picker}
                                            themeVariant="dark"
                                        />
                                    </View>
                                )}

                                {showEndPicker && Platform.OS === 'android' && (
                                    <DateTimePicker
                                        value={endTime}
                                        mode="time"
                                        display="default"
                                        onChange={onEndTimeChange}
                                    />
                                )}

                                <View style={styles.calculatedRow}>
                                    <Text style={styles.calculatedLabel}>Calculated</Text>
                                    <Text style={styles.calculatedValue}>{calculateDuration().toFixed(2)} hrs</Text>
                                </View>
                            </>
                        )}

                        <Input
                            label="Tips / Bonus"
                            placeholder="0.00"
                            value={tip}
                            onChangeText={setTip}
                            keyboardType="decimal-pad"
                        />

                        <Button
                            title="Add to Job"
                            onPress={handleSubmit}
                            loading={isCreating}
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
        maxHeight: '88%',
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
        letterSpacing: 1.3,
        marginBottom: 4,
    },
    title: {
        color: colors.onSurface,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
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
        lineHeight: 28,
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
    inputSection: {
        marginBottom: spacing.lg,
    },
    label: {
        color: colors.primary,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.xs,
        marginLeft: spacing.sm,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerHighest,
        padding: spacing.lg,
        borderRadius: borderRadius.full,
    },
    dateButtonText: {
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
    },
    pickerContainerDark: {
        backgroundColor: colors.slate800,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    pickerHeaderDark: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate600,
    },
    pickerDoneLight: {
        color: colors.primarySoft,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    picker: {
        height: 150,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: borderRadius.full,
        padding: spacing.xs,
        marginBottom: spacing.lg,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: colors.surfaceContainerLowest,
    },
    modeButtonText: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.extrabold,
    },
    modeButtonTextActive: {
        color: colors.primary,
    },
    timeRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    timeInput: {
        flex: 1,
    },
    timeButton: {
        backgroundColor: colors.surfaceContainerHighest,
        padding: spacing.lg,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    timeButtonText: {
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
    },
    calculatedRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    calculatedLabel: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
    },
    calculatedValue: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
});
