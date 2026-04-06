import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EXPENSE_CATEGORIES, CreateExpenseRequest } from '../types';
import { useExpenseStore } from '../stores';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
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
    const { createExpense } = useExpenseStore();
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(7); // Default: Other
    const [date, setDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form on open
    useEffect(() => {
        if (visible) {
            setAmount('');
            setCategory(7);
            setDate(new Date());
            setDescription('');
        }
    }, [visible]);

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Amount',
                text2: 'Please enter a valid amount',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const data: CreateExpenseRequest = {
                amount: parsedAmount,
                category,
                date: date.toISOString(),
                description: description.trim() || undefined,
            };
            await createExpense(data);
            Toast.show({
                type: 'success',
                text1: 'Expense Added',
                text2: `$${parsedAmount.toFixed(2)} - ${EXPENSE_CATEGORIES[category]?.name || 'Other'}`,
            });
            onCreated();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to add expense',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const selectedCategory = EXPENSE_CATEGORIES[category];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>New Expense</Text>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting || !amount}
                    >
                        <Text
                            style={[
                                styles.saveButton,
                                (!amount || isSubmitting) && styles.saveButtonDisabled,
                            ]}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={colors.slate300}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                    </View>

                    {/* Category Selection */}
                    <Text style={styles.sectionLabel}>CATEGORY</Text>
                    <View style={styles.categoryGrid}>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryItem,
                                    category === cat.id && {
                                        backgroundColor: cat.color + '20',
                                        borderColor: cat.color,
                                    },
                                ]}
                                onPress={() => setCategory(cat.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <Text
                                    style={[
                                        styles.categoryName,
                                        category === cat.id && { color: cat.color },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Date Selection */}
                    <Text style={styles.sectionLabel}>DATE</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowDatePicker(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                if (Platform.OS === 'android') {
                                    setShowDatePicker(false);
                                }
                                if (selectedDate) {
                                    setDate(selectedDate);
                                }
                            }}
                            themeVariant="dark"
                        />
                    )}
                    {Platform.OS === 'ios' && showDatePicker && (
                        <TouchableOpacity
                            style={styles.pickerDone}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.pickerDoneText}>Done</Text>
                        </TouchableOpacity>
                    )}

                    {/* Description */}
                    <Text style={styles.sectionLabel}>DESCRIPTION (OPTIONAL)</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What was this expense for?"
                        placeholderTextColor={colors.slate400}
                        multiline
                        maxLength={250}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate200,
        backgroundColor: colors.white,
    },
    cancelButton: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate500,
    },
    title: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
    },
    saveButton: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.primary,
    },
    saveButtonDisabled: {
        color: colors.slate300,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },

    // Amount
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['3xl'],
        marginBottom: spacing.xl,
    },
    currencySymbol: {
        fontSize: 48,
        fontWeight: fontWeights.bold,
        color: colors.slate300,
        marginRight: spacing.sm,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
        minWidth: 120,
        textAlign: 'center',
    },

    // Section
    sectionLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        letterSpacing: 1,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },

    // Categories
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryItem: {
        width: '23%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        borderWidth: 2,
        borderColor: colors.slate200,
        padding: spacing.sm,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    categoryName: {
        fontSize: 10,
        fontWeight: fontWeights.semibold,
        color: colors.slate500,
        textAlign: 'center',
    },

    // Date
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.slate200,
        gap: spacing.md,
    },
    dateIcon: {
        fontSize: 20,
    },
    dateText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate700,
    },
    pickerDone: {
        alignItems: 'flex-end',
        paddingVertical: spacing.sm,
    },
    pickerDoneText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.primary,
    },

    // Description
    descriptionInput: {
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.slate200,
        fontSize: fontSizes.base,
        color: colors.slate700,
        minHeight: 80,
        textAlignVertical: 'top',
    },
});
