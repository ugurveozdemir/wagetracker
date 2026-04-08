import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useJobsStore } from '../stores';
import { colors } from '../theme';
import Toast from 'react-native-toast-message';

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const weekStartDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
] as const;

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ visible, onClose, onCreated }) => {
    const { width } = useWindowDimensions();
    const { createJob, isCreating } = useJobsStore();
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);

    const [title, setTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setTitle('');
            setHourlyRate('');
            setFirstDayOfWeek(1);
            setError(null);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Job title is required');
            return;
        }

        if (!hourlyRate || Number.isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
            setError('Please enter a valid hourly rate');
            return;
        }

        try {
            await createJob({
                title: title.trim(),
                hourlyRate: parseFloat(hourlyRate),
                firstDayOfWeek,
            });

            Toast.show({
                type: 'success',
                text1: 'Job Created',
                text2: `${title.trim()} has been added`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create job';
            setError(message);
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
                        paddingTop: compact ? 14 : 18,
                        paddingBottom: 36,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <Text style={[styles.heading, { fontSize: compact ? 40 : 46 }]}>New Adventure.</Text>

                    <View style={[styles.fieldCard, { borderRadius: 32 * scale }]}> 
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="work" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>JOB TITLE</Text>
                        </View>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="e.g. Resort Manager"
                            placeholderTextColor="#bec9bf"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 32 * scale }]}> 
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="payments" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>HOURLY RATE</Text>
                        </View>
                        <View style={styles.moneyField}>
                            <Text style={styles.moneyPrefix}>$</Text>
                            <TextInput
                                style={styles.moneyInput}
                                placeholder="25.00"
                                placeholderTextColor="#bec9bf"
                                value={hourlyRate}
                                onChangeText={setHourlyRate}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.moneySuffix}>/ hr</Text>
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 32 * scale }]}>
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="event-repeat" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>WEEK STARTS ON</Text>
                        </View>
                        <View style={styles.weekdayRow}>
                            {weekStartDays.map((day) => {
                                const active = firstDayOfWeek === day.value;
                                return (
                                    <TouchableOpacity
                                        key={day.value}
                                        style={[styles.weekdayChip, active && styles.weekdayChipActive]}
                                        activeOpacity={0.88}
                                        onPress={() => setFirstDayOfWeek(day.value)}
                                    >
                                        <Text style={[styles.weekdayChipText, active && styles.weekdayChipTextActive]}>{day.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isCreating}
                    >
                        <Text style={styles.submitButtonText}>{isCreating ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
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
    errorBanner: {
        backgroundColor: '#fff1ef',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        marginBottom: 16,
    },
    heading: {
        color: '#006D44',
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 18,
    },
    errorText: {
        color: '#ba1a1a',
        fontSize: 14,
        fontWeight: '700',
    },
    fieldCard: {
        backgroundColor: '#f5f4eb',
        padding: 20,
        marginBottom: 16,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        paddingHorizontal: 6,
    },
    fieldLabel: {
        color: '#006D44',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.4,
    },
    fieldInput: {
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: '#181d19',
        fontSize: 18,
        fontWeight: '700',
    },
    moneyField: {
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingLeft: 22,
        paddingRight: 20,
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
    },
    moneyPrefix: {
        color: '#6f7a71',
        fontSize: 22,
        fontWeight: '700',
        marginRight: 8,
    },
    moneyInput: {
        flex: 1,
        color: '#181d19',
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '700',
        paddingTop: 4,
        paddingBottom: 2,
    },
    moneySuffix: {
        color: '#6f7a71',
        fontSize: 14,
        fontWeight: '600',
    },
    weekdayRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 6,
    },
    weekdayChip: {
        minWidth: 54,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    weekdayChipActive: {
        backgroundColor: '#006D44',
    },
    weekdayChipText: {
        color: '#6f7a71',
        fontSize: 14,
        fontWeight: '700',
    },
    weekdayChipTextActive: {
        color: '#ffffff',
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: '#006D44',
        minHeight: 66,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});
