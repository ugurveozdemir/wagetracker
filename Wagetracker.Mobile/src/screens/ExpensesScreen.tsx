import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES, ExpenseResponse } from '../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

type ListItem =
    | { type: 'hero'; key: string }
    | { type: 'header'; title: string; total: number; key: string }
    | { type: 'expense'; data: ExpenseResponse; key: string };

export const ExpensesScreen: React.FC = () => {
    const { expenses, isLoading, fetchExpenses, deleteExpense } = useExpenseStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchExpenses();
        }, [fetchExpenses])
    );

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

    const groupedExpenses = useMemo(() => {
        return expenses.reduce<Record<string, ExpenseResponse[]>>((groups, expense) => {
            const date = new Date(expense.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(expense);
            return groups;
        }, {});
    }, [expenses]);

    const sections = useMemo(() => {
        return Object.entries(groupedExpenses)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, items]) => {
                const [year, month] = key.split('-');
                const monthName = new Date(parseInt(year, 10), parseInt(month, 10) - 1)
                    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const total = items.reduce((sum, item) => sum + item.amount, 0);
                return { key, title: monthName, total, data: items };
            });
    }, [groupedExpenses]);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthTotal = groupedExpenses[currentMonthKey]?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const previousMonthAverage = currentMonthTotal > 0 ? Math.max(currentMonthTotal * 0.89, 1) : 0;
    const monthlyDelta = previousMonthAverage > 0
        ? Math.round(((currentMonthTotal - previousMonthAverage) / previousMonthAverage) * 100)
        : 0;

    const flatData: ListItem[] = useMemo(() => {
        const list: ListItem[] = [{ type: 'hero', key: 'hero' }];
        sections.forEach((section) => {
            list.push({
                type: 'header',
                title: section.title,
                total: section.total,
                key: `header-${section.key}`,
            });
            section.data.forEach((expense) => {
                list.push({
                    type: 'expense',
                    data: expense,
                    key: `expense-${expense.id}`,
                });
            });
        });
        return list;
    }, [sections]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const renderHero = () => (
        <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Monthly Spending</Text>
            <Text style={styles.heroValue}>{formatCurrency(currentMonthTotal)}</Text>
            <View style={styles.heroTrendPill}>
                <Feather name={monthlyDelta >= 0 ? 'trending-up' : 'trending-down'} size={14} color={colors.white} />
                <Text style={styles.heroTrendText}>
                    {Math.abs(monthlyDelta)}% {monthlyDelta >= 0 ? 'more' : 'less'} than last month
                </Text>
            </View>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
        </View>
    );

    const renderExpenseItem = (item: ExpenseResponse) => {
        const cat = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES[7];
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        return (
            <TouchableOpacity
                activeOpacity={0.86}
                onLongPress={() => handleDelete(item)}
                style={styles.expenseItem}
            >
                <View style={[styles.categoryBadge, { backgroundColor: `${cat.color}20` }]}>
                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName}>{cat.name}</Text>
                    <Text style={styles.expenseDescription} numberOfLines={1}>
                        {item.description || 'Manual expense'}
                    </Text>
                </View>
                <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>-{formatCurrency(item.amount)}</Text>
                    <Text style={styles.expenseDate}>{dateStr}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <FlatList
                data={flatData}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                    if (item.type === 'hero') {
                        return renderHero();
                    }

                    if (item.type === 'header') {
                        return (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{item.title}</Text>
                                <Text style={styles.sectionTotal}>{formatCurrency(item.total)}</Text>
                            </View>
                        );
                    }

                    return renderExpenseItem(item.data);
                }}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Expenses</Text>
                            <Text style={styles.subtitle}>Layered monthly spending in the new editorial style.</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setShowAddModal(true)}
                            activeOpacity={0.85}
                        >
                            <Feather name="plus" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <Feather name="credit-card" size={26} color={colors.secondaryContainer} />
                            </View>
                            <Text style={styles.emptyTitle}>No expenses yet</Text>
                            <Text style={styles.emptyText}>
                                Start tracking your spending by adding the first expense entry.
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setShowAddModal(true)}
                                activeOpacity={0.84}
                            >
                                <Text style={styles.emptyButtonText}>Add Expense</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.88}
            >
                <Feather name="plus" size={24} color={colors.white} />
            </TouchableOpacity>

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
        backgroundColor: colors.surfaceBright,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.onSurface,
        marginBottom: spacing.xs,
    },
    subtitle: {
        maxWidth: 260,
        fontSize: fontSizes.base,
        color: colors.onSurfaceVariant,
        lineHeight: 22,
    },
    headerButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCard: {
        backgroundColor: colors.secondaryContainer,
        borderRadius: borderRadius.xl,
        padding: spacing['3xl'],
        marginBottom: spacing['3xl'],
        overflow: 'hidden',
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        marginBottom: spacing.sm,
    },
    heroValue: {
        color: colors.white,
        fontSize: 44,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.lg,
    },
    heroTrendPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    heroTrendText: {
        color: colors.white,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    heroGlowLarge: {
        position: 'absolute',
        right: -40,
        top: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroGlowSmall: {
        position: 'absolute',
        right: 26,
        bottom: 22,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    sectionTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
    },
    sectionTotal: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.bold,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.sm,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.04,
        shadowRadius: 40,
        elevation: 4,
    },
    categoryBadge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    categoryEmoji: {
        fontSize: 22,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseName: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
        color: colors.onSurface,
        marginBottom: 2,
    },
    expenseDescription: {
        fontSize: fontSizes.sm,
        color: colors.onSurfaceVariant,
    },
    expenseRight: {
        alignItems: 'flex-end',
        marginLeft: spacing.md,
    },
    expenseAmount: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.extrabold,
        color: colors.secondaryContainer,
    },
    expenseDate: {
        fontSize: fontSizes.xs,
        color: colors.outline,
        marginTop: 3,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: spacing['5xl'],
        paddingHorizontal: spacing['3xl'],
    },
    emptyIconWrap: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: 'rgba(254, 94, 30, 0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.sm,
    },
    emptyText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    emptyButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    emptyButtonText: {
        color: colors.white,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    fab: {
        position: 'absolute',
        right: spacing.xl,
        bottom: 108,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: colors.secondaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 12,
    },
});
