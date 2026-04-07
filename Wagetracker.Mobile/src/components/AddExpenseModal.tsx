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
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES } from '../types';
import Toast from 'react-native-toast-message';

interface AddExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    visible,
    onClose,
    onCreated,
}) => {
    const { width } = useWindowDimensions();
    const { createExpense, isLoading } = useExpenseStore();
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(7);
    const [date, setDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setAmount('');
            setCategory(7);
            setDate(new Date());
            setDescription('');
            setError(null);
            setShowDatePicker(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);

        if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            await createExpense({
                amount: parsedAmount,
                category,
                date: date.toISOString().split('T')[0],
                description: description.trim() || undefined,
            });

            Toast.show({
                type: 'success',
                text1: 'Expense Added',
                text2: `$${parsedAmount.toFixed(2)} recorded successfully`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add expense';
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
                    <TouchableOpacity style={styles.backRow} activeOpacity={0.8} onPress={onClose}>
                        <MaterialIcons name="arrow-back" size={20} color="#3f4942" />
                        <Text style={styles.backText}>Add Expense</Text>
                    </TouchableOpacity>

                    <View style={[styles.heroCard, { borderRadius: 40 * scale, padding: 28 * scale }]}>
                        <Text style={styles.heroLabel}>TOTAL MONTHLY SPENDING</Text>
                        <Text style={[styles.heroValue, { fontSize: compact ? 42 : 50 }]}>${amount || '0.00'}</Text>
                        <Text style={styles.heroSubtext}>Capture every outgoing line item in the same ledger rhythm.</Text>
                    </View>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.fieldCard, { borderRadius: 28 * scale }]}>
                        <Text style={styles.fieldLabel}>Amount</Text>
                        <View style={styles.moneyField}>
                            <Text style={styles.moneyPrefix}>$</Text>
                            <TextInput
                                style={styles.moneyInput}
                                placeholder="25.50"
                                placeholderTextColor="#bec9bf"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 28 * scale }]}>
                        <Text style={styles.fieldLabel}>Category</Text>
                        <View style={styles.categoryWrap}>
                            {EXPENSE_CATEGORIES.map((item) => {
                                const active = item.id === category;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                                        activeOpacity={0.88}
                                        onPress={() => setCategory(item.id)}
                                    >
                                        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 28 * scale }]}>
                        <Text style={styles.fieldLabel}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} activeOpacity={0.88} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateText}>
                                {date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
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

                    <View style={[styles.fieldCard, { borderRadius: 28 * scale }]}>
                        <Text style={styles.fieldLabel}>Description</Text>
                        <TextInput
                            style={[styles.descriptionInput, { minHeight: 110 * scale, borderRadius: 24 * scale }]}
                            multiline
                            placeholder="Optional note for this expense..."
                            placeholderTextColor="#bec9bf"
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <MaterialIcons name="add-circle" size={20} color="#412100" />
                        <Text style={styles.submitButtonText}>{isLoading ? 'Saving...' : 'Save Expense'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fbf9f1' },
    container: { flex: 1, backgroundColor: '#fbf9f1' },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
    backText: { color: '#3f4942', fontSize: 18, fontWeight: '700' },
    heroCard: { backgroundColor: '#ff8a00', marginBottom: 18 },
    heroLabel: { color: 'rgba(65,33,0,0.80)', fontSize: 12, fontWeight: '700', letterSpacing: 1.7, marginBottom: 8 },
    heroValue: { color: '#412100', fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
    heroSubtext: { color: 'rgba(65,33,0,0.80)', fontSize: 14, lineHeight: 22 },
    errorBanner: { backgroundColor: '#fff1ef', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, marginBottom: 16 },
    errorText: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
    fieldCard: { backgroundColor: '#f5f4eb', padding: 20, marginBottom: 16 },
    fieldLabel: { color: '#181d19', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    moneyField: { backgroundColor: '#ffffff', borderRadius: 999, minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    moneyPrefix: { color: '#6f7a71', fontSize: 24, fontWeight: '700', marginRight: 8 },
    moneyInput: { flex: 1, color: '#181d19', fontSize: 32, fontWeight: '700' },
    categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryChip: { backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
    categoryChipActive: { backgroundColor: '#ecf8f0' },
    categoryChipText: { color: '#4f5a53', fontSize: 13, fontWeight: '700' },
    categoryChipTextActive: { color: '#006D44' },
    dateButton: { backgroundColor: '#ffffff', borderRadius: 999, minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateText: { color: '#181d19', fontSize: 18, fontWeight: '700' },
    descriptionInput: { backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 16, color: '#181d19', fontSize: 16, lineHeight: 24 },
    submitButton: { marginTop: 8, backgroundColor: '#ff8a00', minHeight: 64, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#412100', fontSize: 20, fontWeight: '800' },
    pickerWrap: { backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', marginBottom: 18 },
    pickerHeader: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
    pickerDone: { color: '#006D44', fontSize: 16, fontWeight: '700' },
});
