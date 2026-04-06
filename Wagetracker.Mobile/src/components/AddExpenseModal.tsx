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
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES } from '../types';
import { Button, Input } from './ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 150;

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
    const { createExpense, isLoading } = useExpenseStore();
    const translateY = useRef(new Animated.Value(0)).current;

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(7); // Default: Other
    const [date, setDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

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
            setAmount('');
            setCategory(7);
            setDate(new Date());
            setDescription('');
            setError(null);
            setShowDatePicker(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        Keyboard.dismiss();

        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
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
            const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
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

    const categoryEntries = Object.entries(EXPENSE_CATEGORIES);

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
                        <Text style={styles.title}>Add Expense 💸</Text>
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
                            {/* Amount Input */}
                            <Input
                                label="Amount ($)"
                                placeholder="e.g. 25.50"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />

                            {/* Category Selection */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>CATEGORY</Text>
                                <View style={styles.categoryGrid}>
                                    {categoryEntries.map(([key, cat]) => {
                                        const catIndex = parseInt(key);
                                        const isSelected = category === catIndex;
                                        return (
                                            <TouchableOpacity
                                                key={key}
                                                style={[
                                                    styles.categoryItem,
                                                    isSelected && styles.categoryItemSelected,
                                                ]}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    setCategory(catIndex);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                                <Text
                                                    style={[
                                                        styles.categoryName,
                                                        isSelected && styles.categoryNameSelected,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Date Picker */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>DATE</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
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

                            {/* Description */}
                            <Input
                                label="Description (Optional)"
                                placeholder="What was this expense for?"
                                value={description}
                                onChangeText={setDescription}
                            />

                            {/* Submit Button */}
                            <Button
                                title="Add Expense"
                                onPress={handleSubmit}
                                loading={isLoading}
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

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryItem: {
        width: '23%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius['2xl'],
        backgroundColor: colors.slate50,
    },
    categoryItemSelected: {
        backgroundColor: colors.primary + '15',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    categoryName: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        color: colors.slate500,
        textAlign: 'center',
    },
    categoryNameSelected: {
        color: colors.primary,
        fontWeight: fontWeights.bold,
    },

    // Date
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
    pickerContainerDark: {
        backgroundColor: colors.slate800,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
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
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.primaryLight,
    },
});
