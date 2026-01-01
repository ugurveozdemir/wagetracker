import React, { useState, useEffect, useRef } from 'react';
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

    const calculateDuration = (): number => {
        const diff = (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
        return diff < 0 ? diff + 24 : diff;
    };

    const formatTime = (time: Date): string => {
        return time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatTimeForApi = (time: Date): string => {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}:00`;
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

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onStartTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
        }
        if (selectedTime) {
            setStartTime(selectedTime);
        }
    };

    const onEndTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowEndPicker(false);
        }
        if (selectedTime) {
            setEndTime(selectedTime);
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
                        <Text style={styles.title}>Add Entry ⚡️</Text>
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
                            {/* Date Picker */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>DATE</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowStartPicker(false);
                                        setShowEndPicker(false);
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={styles.calendarIcon}>📅</Text>
                                </TouchableOpacity>
                            </View>

                            {/* iOS Date Picker */}
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

                            {/* Mode Toggle */}
                            <View style={styles.modeToggle}>
                                <TouchableOpacity
                                    style={[
                                        styles.modeButton,
                                        entryMode === 'total' && styles.modeButtonActive,
                                    ]}
                                    onPress={() => setEntryMode('total')}
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
                                    style={[
                                        styles.modeButton,
                                        entryMode === 'time' && styles.modeButtonActive,
                                    ]}
                                    onPress={() => setEntryMode('time')}
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

                            {/* Hours Input or Time Pickers */}
                            {entryMode === 'total' ? (
                                <Input
                                    label="Duration (Hours)"
                                    placeholder="e.g. 8.5"
                                    value={hours}
                                    onChangeText={setHours}
                                    keyboardType="decimal-pad"
                                />
                            ) : (
                                <>
                                    <View style={styles.timeRow}>
                                        <View style={styles.timeInput}>
                                            <Text style={styles.timeLabel}>START</Text>
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
                                        <Text style={styles.timeArrow}>→</Text>
                                        <View style={styles.timeInput}>
                                            <Text style={styles.timeLabel}>END</Text>
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

                                    {/* Start Time Picker */}
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

                                    {/* End Time Picker */}
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

                                    {/* Calculated Duration */}
                                    <View style={styles.calculatedRow}>
                                        <Text style={styles.calculatedLabel}>Calculated:</Text>
                                        <Text style={styles.calculatedValue}>{calculateDuration().toFixed(2)} hrs</Text>
                                    </View>
                                </>
                            )}

                            {/* Tip Input */}
                            <Input
                                label="Tips / Bonus (Optional)"
                                placeholder="0.00"
                                value={tip}
                                onChangeText={setTip}
                                keyboardType="decimal-pad"
                            />

                            {/* Submit Button */}
                            <Button
                                title="Add to Job"
                                onPress={handleSubmit}
                                loading={isCreating}
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
        maxHeight: '85%',
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
    inputSection: {
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        marginLeft: spacing.sm,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.slate50,
        padding: spacing.md,
        borderRadius: borderRadius['2xl'],
    },
    dateButtonText: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    calendarIcon: {
        fontSize: fontSizes.lg,
    },
    datePickerContainer: {
        backgroundColor: colors.slate50,
        borderRadius: borderRadius['2xl'],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        alignSelf: 'flex-start',
    },
    compactPicker: {
        marginLeft: -spacing.sm,
    },
    pickerContainer: {
        backgroundColor: colors.slate50,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    pickerContainerDark: {
        backgroundColor: colors.slate800,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate200,
    },
    pickerHeaderDark: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate600,
    },
    pickerDone: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.primary,
    },
    pickerDoneLight: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.primaryLight,
    },
    picker: {
        height: 150,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.slate100,
        borderRadius: borderRadius['2xl'],
        padding: spacing.xs,
        marginBottom: spacing.md,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: colors.white,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    modeButtonText: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.extrabold,
        color: colors.slate400,
    },
    modeButtonTextActive: {
        color: colors.primary,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    timeInput: {
        flex: 1,
    },
    timeLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    timeButton: {
        backgroundColor: colors.slate50,
        padding: spacing.md,
        borderRadius: borderRadius['2xl'],
        alignItems: 'center',
    },
    timeButtonText: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    timeArrow: {
        fontSize: fontSizes.xl,
        color: colors.slate300,
        marginTop: spacing.lg,
    },
    calculatedRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    calculatedLabel: {
        fontSize: fontSizes.sm,
        color: colors.slate400,
        fontWeight: fontWeights.medium,
    },
    calculatedValue: {
        fontSize: fontSizes.lg,
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
    },
});
