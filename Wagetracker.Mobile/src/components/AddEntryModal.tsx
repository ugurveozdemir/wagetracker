import React, { useState, useEffect } from 'react';
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEntriesStore } from '../stores';
import { Button, Input } from './ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

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

    useEffect(() => {
        if (visible) {
            // Reset form when modal opens
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
            onCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create entry');
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onStartTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedTime) {
            setStartTime(selectedTime);
        }
    };

    const onEndTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedTime) {
            setEndTime(selectedTime);
        }
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
                            <Text style={styles.title}>Add Entry ⚡️</Text>
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
                            {/* Date Picker */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>DATE</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {date.toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }).replace(/\//g, '.')}
                                    </Text>
                                    <Text style={styles.calendarIcon}>📅</Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                    />
                                )}
                            </View>

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
                                <View style={styles.timeRow}>
                                    <View style={styles.timeInput}>
                                        <Text style={styles.timeLabel}>START</Text>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => setShowStartPicker(true)}
                                        >
                                            <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
                                        </TouchableOpacity>
                                        {showStartPicker && (
                                            <DateTimePicker
                                                value={startTime}
                                                mode="time"
                                                display="default"
                                                onChange={onStartTimeChange}
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.timeArrow}>→</Text>
                                    <View style={styles.timeInput}>
                                        <Text style={styles.timeLabel}>END</Text>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => setShowEndPicker(true)}
                                        >
                                            <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
                                        </TouchableOpacity>
                                        {showEndPicker && (
                                            <DateTimePicker
                                                value={endTime}
                                                mode="time"
                                                display="default"
                                                onChange={onEndTimeChange}
                                            />
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Calculated Duration */}
                            {entryMode === 'time' && (
                                <View style={styles.calculatedRow}>
                                    <Text style={styles.calculatedLabel}>Calculated:</Text>
                                    <Text style={styles.calculatedValue}>{calculateDuration().toFixed(2)} hrs</Text>
                                </View>
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
    inputSection: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.slate50,
        padding: spacing.lg,
        borderRadius: borderRadius['3xl'],
    },
    dateButtonText: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    calendarIcon: {
        fontSize: fontSizes.lg,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.slate100,
        borderRadius: borderRadius['3xl'],
        padding: spacing.xs,
        marginBottom: spacing.md,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius['2xl'],
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
        fontSize: fontSizes.base,
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
        marginBottom: spacing.md,
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
        padding: spacing.lg,
        borderRadius: borderRadius['3xl'],
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
