import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    KeyboardAvoidingView,
    ScrollView,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEntriesStore } from '../stores';
import { colors } from '../theme';
import Toast from 'react-native-toast-message';

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
    const { width } = useWindowDimensions();
    const { createEntry, isCreating } = useEntriesStore();
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);

    const [date, setDate] = useState(new Date('2023-10-24'));
    const [hours, setHours] = useState('8');
    const [tip, setTip] = useState('10');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setDate(new Date());
            setHours('8');
            setTip('10');
            setNote('');
            setError(null);
            setShowDatePicker(false);
        }
    }, [visible]);

    const totalHours = parseFloat(hours || '0') || 0;
    const totalTips = parseFloat(tip || '0') || 0;

    const handleSubmit = async () => {
        if (!hours || Number.isNaN(totalHours) || totalHours <= 0) {
            setError('Please enter valid hours');
            return;
        }

        try {
            await createEntry({
                jobId,
                date: date.toISOString().split('T')[0],
                startTime: null,
                endTime: null,
                totalHours,
                tip: totalTips,
                note: note.trim() || null,
            });

            Toast.show({
                type: 'success',
                text1: 'Entry Added',
                text2: `${totalHours.toFixed(1)} hours recorded successfully`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create entry';
            setError(message);
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

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.safeArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{
                        paddingHorizontal: compact ? 18 : 24,
                        paddingTop: 12,
                        paddingBottom: 36,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.topBar}>
                        <View style={styles.brandRow}>
                            <View style={styles.avatarWrap}>
                                <MaterialIcons name="person" size={14} color="#ffffff" />
                            </View>
                            <Text style={styles.brandText}>The Kinetic Ledger</Text>
                        </View>
                        <Text style={styles.currencyText}>USD ($)</Text>
                    </View>

                    <View style={styles.roleRow}>
                        <MaterialIcons name="work" size={14} color="#94a3b8" />
                        <Text style={styles.roleText}>HOUSEKEEPER ROLE</Text>
                    </View>

                    <View style={[styles.heroCard, { borderRadius: 48 * scale, padding: 28 * scale }]}>
                        <View>
                            <Text style={styles.heroLabel}>Total Earned Today</Text>
                            <Text style={[styles.heroValue, { fontSize: compact ? 48 : 54 }]}>$130.00</Text>
                        </View>

                        <View style={styles.heroPillsRow}>
                            <View style={styles.heroPill}>
                                <Text style={styles.heroPillLabel}>RATE</Text>
                                <Text style={styles.heroPillValue}>$15/hr</Text>
                            </View>
                            <View style={styles.heroPill}>
                                <Text style={styles.heroPillLabel}>BONUS</Text>
                                <Text style={styles.heroPillBonus}>+$10 Tips</Text>
                            </View>
                        </View>

                        <View style={styles.heroGhost}>
                            <MaterialIcons name="cleaning-services" size={72} color="rgba(0,109,68,0.10)" />
                        </View>
                    </View>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Work Date</Text>
                        <TouchableOpacity style={styles.fieldInputWrap} activeOpacity={0.88} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.fieldInputText}>
                                {date.toLocaleDateString('en-US')}
                            </Text>
                            <MaterialIcons name="calendar-today" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && Platform.OS === 'ios' ? (
                        <View style={styles.pickerWrap}>
                            <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.pickerDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker value={date} mode="date" display="inline" onChange={onDateChange} />
                        </View>
                    ) : null}

                    {showDatePicker && Platform.OS === 'android' ? (
                        <DateTimePicker value={date} mode="date" display="calendar" onChange={onDateChange} />
                    ) : null}

                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Hours Worked</Text>
                        <View style={styles.fieldInputWrap}>
                            <TextInput
                                style={styles.numberInput}
                                value={hours}
                                onChangeText={setHours}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                            />
                            <Text style={styles.trailingHint}>hrs</Text>
                        </View>
                    </View>

                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Tips Received</Text>
                        <View style={styles.fieldInputWrap}>
                            <Text style={styles.leadingHint}>$</Text>
                            <TextInput
                                style={[styles.numberInput, styles.moneyEntryInput]}
                                value={tip}
                                onChangeText={setTip}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Shift Notes (Optional)</Text>
                        <TextInput
                            style={[styles.notesInput, { minHeight: 120 * scale, borderRadius: 24 * scale }]}
                            multiline
                            placeholder="Extra heavy checkout day..."
                            placeholderTextColor="#94a3b8"
                            value={note}
                            onChangeText={setNote}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isCreating}
                    >
                        <MaterialIcons name="add-circle" size={20} color="#412100" />
                        <Text style={styles.confirmText}>{isCreating ? 'Saving...' : 'Confirm Entry'}</Text>
                    </TouchableOpacity>

                    <View style={styles.successHint}>
                        <View style={styles.successIcon}>
                            <MaterialIcons name="check" size={14} color="#ffffff" />
                        </View>
                        <Text style={styles.successText}>
                            Your hourly rate is locked at <Text style={styles.successTextStrong}>$15.00/hr</Text> for this position.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    container: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#263746',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandText: {
        color: '#006D44',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    currencyText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '700',
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 18,
    },
    roleText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    heroCard: {
        backgroundColor: '#f1f5ef',
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative',
    },
    heroLabel: {
        color: '#6f7a71',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    heroValue: {
        color: '#006D44',
        fontWeight: '800',
        letterSpacing: -1.3,
        marginBottom: 18,
    },
    heroPillsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    heroPill: {
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    heroPillLabel: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    heroPillValue: {
        color: '#006D44',
        fontSize: 19,
        fontWeight: '700',
    },
    heroPillBonus: {
        color: '#ff8a00',
        fontSize: 19,
        fontWeight: '700',
    },
    heroGhost: {
        position: 'absolute',
        right: 18,
        top: 24,
    },
    errorBanner: {
        backgroundColor: '#fff1ef',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        marginBottom: 14,
    },
    errorText: {
        color: '#ba1a1a',
        fontSize: 14,
        fontWeight: '700',
    },
    fieldBlock: {
        marginBottom: 18,
    },
    fieldLabel: {
        color: '#181d19',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    fieldInputWrap: {
        backgroundColor: '#eae8e0',
        minHeight: 58,
        borderRadius: 999,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldInputText: {
        flex: 1,
        color: '#4f5a53',
        fontSize: 24,
        fontWeight: '500',
    },
    numberInput: {
        flex: 1,
        color: '#181d19',
        fontSize: 34,
        fontWeight: '700',
        paddingVertical: 10,
    },
    moneyEntryInput: {
        marginLeft: 10,
    },
    trailingHint: {
        color: '#94a3b8',
        fontSize: 18,
        fontWeight: '700',
    },
    leadingHint: {
        color: '#6f7a71',
        fontSize: 28,
        fontWeight: '700',
    },
    notesInput: {
        backgroundColor: '#eae8e0',
        paddingHorizontal: 20,
        paddingVertical: 18,
        color: '#181d19',
        fontSize: 18,
        lineHeight: 26,
    },
    confirmButton: {
        backgroundColor: '#ff8a00',
        minHeight: 64,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 6,
        marginBottom: 18,
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
    confirmText: {
        color: '#412100',
        fontSize: 21,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    successHint: {
        backgroundColor: 'rgba(0,109,68,0.10)',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    successIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#006D44',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successText: {
        flex: 1,
        color: '#2b7a57',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },
    successTextStrong: {
        fontWeight: '800',
    },
    pickerWrap: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 18,
    },
    pickerHeader: {
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    pickerDone: {
        color: '#006D44',
        fontSize: 16,
        fontWeight: '700',
    },
});
