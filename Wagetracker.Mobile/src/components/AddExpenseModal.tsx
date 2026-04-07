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
    const [category, setCategory] = useState(7);
    const [date, setDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

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

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const categoryEntries = Object.entries(EXPENSE_CATEGORIES);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
                    <View {...panResponder.panHandlers} style={styles.handleArea}>
                        <View style={styles.handleBar} />
                    </View>

                    <View style={styles.header}>
                        <View>
                            <Text style={styles.eyebrow}>Spending Log</Text>
                            <Text style={styles.title}>Add Expense</Text>
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
                            <Text style={styles.heroLabel}>Monthly Capture</Text>
                            <Text style={styles.heroTitle}>Keep every outgoing line item in rhythm.</Text>
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Input
                            label="Amount ($)"
                            placeholder="25.50"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryGrid}>
                                {categoryEntries.map(([key, cat]) => {
                                    const catIndex = parseInt(key, 10);
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
                                            activeOpacity={0.8}
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

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => {
                                    Keyboard.dismiss();
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

                        <Input
                            label="Description"
                            placeholder="Whole Foods, Uber, rent, coffee..."
                            value={description}
                            onChangeText={setDescription}
                        />

                        <Button
                            title="Add Expense"
                            onPress={handleSubmit}
                            loading={isLoading}
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
        maxHeight: '86%',
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
        backgroundColor: colors.secondaryContainer,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        marginBottom: spacing.lg,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    heroTitle: {
        color: colors.white,
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
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surfaceContainerHighest,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 86,
    },
    categoryItemSelected: {
        backgroundColor: 'rgba(0, 109, 68, 0.10)',
        borderColor: 'rgba(0, 109, 68, 0.18)',
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    categoryName: {
        color: colors.outline,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    categoryNameSelected: {
        color: colors.primary,
        fontWeight: fontWeights.bold,
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
});
