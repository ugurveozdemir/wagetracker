import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES, ExpenseResponse } from '../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

export const ExpensesScreen: React.FC = () => {
    const { expenses, isLoading, fetchExpenses, deleteExpense } = useExpenseStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchExpenses();
        setRefreshing(false);
    }, [fetchExpenses]);

    const handleDelete = (expense: ExpenseResponse) => {
        const cat = EXPENSE_CATEGORIES[expense.category] || EXPENSE_CATEGORIES[7];
        Alert.alert(
            'Delete Expense',
            `Delete ${cat.name} expense of $${expense.amount.toFixed(2)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteExpense(expense.id);
                            Toast.show({
                                type: 'success',
                                text1: 'Expense Deleted',
                                visibilityTime: 2000,
                            });
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error.message,
                            });
                        }
                    },
                },
            ]
        );
    };

    // Group expenses by month
    const groupedExpenses = expenses.reduce<Record<string, ExpenseResponse[]>>(
        (groups, expense) => {
            const date = new Date(expense.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(expense);
            return groups;
        },
        {}
    );

    const sections = Object.entries(groupedExpenses)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, items]) => {
            const [year, month] = key.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
                'en-US',
                { month: 'long', year: 'numeric' }
            );
            const total = items.reduce((sum, e) => sum + e.amount, 0);
            return { key, title: monthName, total, data: items };
        });

    // Current month total
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthTotal = groupedExpenses[currentMonthKey]?.reduce(
        (sum, e) => sum + e.amount,
        0
    ) || 0;

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const renderSwipeAction = () => (
        <View style={styles.swipeAction}>
            <Text style={styles.swipeActionText}>🗑️</Text>
        </View>
    );

    const renderExpenseItem = ({ item }: { item: ExpenseResponse }) => {
        const cat = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES[7];
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        return (
            <Swipeable
                renderRightActions={renderSwipeAction}
                onSwipeableOpen={() => handleDelete(item)}
            >
                <View style={styles.expenseItem}>
                    <View style={[styles.categoryBadge, { backgroundColor: cat.color + '20' }]}>
                        <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    </View>
                    <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName}>{cat.name}</Text>
                        {item.description ? (
                            <Text style={styles.expenseDescription} numberOfLines={1}>
                                {item.description}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.expenseRight}>
                        <Text style={styles.expenseAmount}>
                            -{formatCurrency(item.amount)}
                        </Text>
                        <Text style={styles.expenseDate}>{dateStr}</Text>
                    </View>
                </View>
            </Swipeable>
        );
    };

    // Flatten sections for FlatList
    type ListItem =
        | { type: 'header'; title: string; total: number; key: string }
        | { type: 'expense'; data: ExpenseResponse; key: string };

    const flatData: ListItem[] = [];
    sections.forEach((section) => {
        flatData.push({
            type: 'header',
            title: section.title,
            total: section.total,
            key: `header-${section.key}`,
        });
        section.data.forEach((expense) => {
            flatData.push({
                type: 'expense',
                data: expense,
                key: `expense-${expense.id}`,
            });
        });
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Expenses</Text>
                <View style={styles.monthSummary}>
                    <Text style={styles.monthLabel}>This Month</Text>
                    <Text style={styles.monthTotal}>{formatCurrency(currentMonthTotal)}</Text>
                </View>
            </View>

            {expenses.length === 0 && !isLoading ? (
                /* Empty State */
                <View style={styles.emptyState}>
                    <View style={styles.emptyIllustration}>
                        <Text style={styles.emptyMainEmoji}>💸</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No expenses yet</Text>
                    <Text style={styles.emptyText}>
                        Start tracking your spending by{'\n'}adding your first expense
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.emptyButtonIcon}>+</Text>
                        <Text style={styles.emptyButtonText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={flatData}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{item.title}</Text>
                                    <Text style={styles.sectionTotal}>
                                        {formatCurrency(item.total)}
                                    </Text>
                                </View>
                            );
                        }
                        return renderExpenseItem({ item: item.data });
                    }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}


            <AddExpenseModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => {
                    setShowAddModal(false);
                    fetchExpenses();
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
    },
    monthSummary: {
        alignItems: 'flex-end',
    },
    monthLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
        letterSpacing: 0.5,
    },
    monthTotal: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        color: '#ef4444',
    },

    // List
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.slate500,
    },
    sectionTotal: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.slate400,
    },

    // Expense Item
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.sm,
        gap: spacing.md,
    },
    categoryBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryEmoji: {
        fontSize: 20,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseName: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        color: colors.slate800,
    },
    expenseDescription: {
        fontSize: fontSizes.sm,
        color: colors.slate400,
        marginTop: 2,
    },
    expenseRight: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: '#ef4444',
    },
    expenseDate: {
        fontSize: fontSizes.xs,
        color: colors.slate400,
        marginTop: 2,
    },

    // Swipe
    swipeAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.sm,
    },
    swipeActionText: {
        fontSize: 24,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['3xl'],
    },
    emptyIllustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ef444420',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyMainEmoji: {
        fontSize: 48,
    },
    emptyTitle: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.slate800,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius['3xl'],
        gap: spacing.sm,
    },
    emptyButtonIcon: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },
    emptyButtonText: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.white,
    },

});
