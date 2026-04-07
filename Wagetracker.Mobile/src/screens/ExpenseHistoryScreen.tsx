import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ExpenseStackParamList, EXPENSE_CATEGORIES } from '../types';
import { useExpenseStore } from '../stores';
import { colors } from '../theme';

type ExpenseHistoryNavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseHistory'>;

const categoryIconMap: Record<number, string> = {
    0: 'restaurant',
    1: 'directions-car',
    2: 'shopping-bag',
    3: 'lightbulb',
    4: 'theater-comedy',
    5: 'local-hospital',
    6: 'school',
    7: 'receipt-long',
};

export const ExpenseHistoryScreen: React.FC = () => {
    const navigation = useNavigation<ExpenseHistoryNavigationProp>();
    const { weeklyGroups, fetchWeeklyGroups, isLoading } = useExpenseStore();

    useFocusEffect(
        useCallback(() => {
            fetchWeeklyGroups();
        }, [fetchWeeklyGroups])
    );

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatWeekRange = (weekStart: string, weekEnd: string) => {
        const start = new Date(weekStart);
        const end = new Date(weekEnd);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    if (isLoading && weeklyGroups.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fbf9f1" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expense History</Text>
                <View style={styles.headerButtonPlaceholder} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchWeeklyGroups} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Weekly Spending Ledger</Text>
                    <Text style={styles.heroTitle}>Grouped by Monday-start weeks</Text>
                    <Text style={styles.heroSubcopy}>Tap back any time to return to your all-time expense overview.</Text>
                </View>

                {weeklyGroups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No expenses yet</Text>
                        <Text style={styles.emptyText}>Use the floating add action to log your first expense.</Text>
                    </View>
                ) : (
                    weeklyGroups.map((group) => (
                        <View key={group.weekStart} style={styles.weekCard}>
                            <View style={styles.weekHeader}>
                                <View>
                                    <Text style={styles.weekTitle}>{formatWeekRange(group.weekStart, group.weekEnd)}</Text>
                                    <Text style={styles.weekMeta}>Monday through Sunday</Text>
                                </View>
                                <Text style={styles.weekAmount}>{formatCurrency(group.totalAmount)}</Text>
                            </View>

                            <View style={styles.expenseList}>
                                {group.expenses.map((expense) => {
                                    const category = EXPENSE_CATEGORIES[expense.category] ?? EXPENSE_CATEGORIES[7];
                                    return (
                                        <View key={expense.id} style={styles.expenseRow}>
                                            <View style={[styles.expenseIconWrap, { backgroundColor: `${category.color}22` }]}>
                                                <MaterialIcons
                                                    name={categoryIconMap[expense.category] ?? 'receipt-long'}
                                                    size={18}
                                                    color={category.color}
                                                />
                                            </View>

                                            <View style={styles.expenseCopy}>
                                                <Text style={styles.expenseTitle}>{expense.categoryName}</Text>
                                                <Text style={styles.expenseMeta}>
                                                    {new Date(expense.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </Text>
                                                {expense.description ? (
                                                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                                                ) : null}
                                            </View>

                                            <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbf9f1',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#f1f5ef',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonPlaceholder: {
        width: 42,
        height: 42,
    },
    headerTitle: {
        color: '#181d19',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    heroCard: {
        backgroundColor: '#f1f5ef',
        borderRadius: 32,
        padding: 28,
        marginBottom: 24,
    },
    heroEyebrow: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.6,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: '#006D44',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.8,
        marginBottom: 8,
    },
    heroSubcopy: {
        color: '#4f5a53',
        fontSize: 15,
        lineHeight: 22,
    },
    emptyState: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#181d19',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
    },
    emptyText: {
        color: '#6f7a71',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    weekCard: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 22,
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
        elevation: 3,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    weekTitle: {
        color: '#181d19',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    weekMeta: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    weekAmount: {
        color: '#ab3600',
        fontSize: 20,
        fontWeight: '800',
    },
    expenseList: {
        gap: 12,
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5ef',
    },
    expenseIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expenseCopy: {
        flex: 1,
    },
    expenseTitle: {
        color: '#181d19',
        fontSize: 15,
        fontWeight: '700',
    },
    expenseMeta: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    expenseDescription: {
        color: '#4f5a53',
        fontSize: 12,
        marginTop: 3,
    },
    expenseAmount: {
        color: '#181d19',
        fontSize: 15,
        fontWeight: '800',
    },
});
