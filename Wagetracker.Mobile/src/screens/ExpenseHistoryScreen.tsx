import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ExpenseResponse, ExpenseStackParamList, EXPENSE_CATEGORIES } from '../types';
import { useExpenseStore } from '../stores';
import { colors } from '../theme';
import Toast from 'react-native-toast-message';

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
    const { weeklyGroups, fetchWeeklyGroups, isLoadingWeeklyGroups, hasLoadedWeeklyGroups, deleteExpense } = useExpenseStore();
    const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<number, boolean>>({});

    useFocusEffect(
        useCallback(() => {
            fetchWeeklyGroups({ silent: hasLoadedWeeklyGroups });
        }, [fetchWeeklyGroups, hasLoadedWeeklyGroups])
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

    const handleDeleteExpense = (expenseId: number, title: string) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteExpense(expenseId);
                            Toast.show({
                                type: 'delete',
                                text1: 'Expense Deleted',
                                text2: `${title} has been removed`,
                                visibilityTime: 2000,
                            });
                        } catch {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete expense',
                                visibilityTime: 3000,
                            });
                        }
                    },
                },
            ]
        );
    };

    const toggleExpenseExpanded = (expenseId: number) => {
        setExpandedExpenseIds((state) => ({
            ...state,
            [expenseId]: !state[expenseId],
        }));
    };

    if (isLoadingWeeklyGroups && !hasLoadedWeeklyGroups) {
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
                refreshControl={<RefreshControl refreshing={isLoadingWeeklyGroups} onRefresh={fetchWeeklyGroups} />}
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
                                        <ExpenseHistoryItem
                                            key={expense.id}
                                            expense={expense}
                                            color={category.color}
                                            iconName={categoryIconMap[expense.category] ?? 'receipt-long'}
                                            formatCurrency={formatCurrency}
                                            onDelete={() => handleDeleteExpense(expense.id, expense.categoryName)}
                                            expanded={!!expandedExpenseIds[expense.id]}
                                            onToggleExpanded={() => toggleExpenseExpanded(expense.id)}
                                        />
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

interface ExpenseHistoryItemProps {
    expense: ExpenseResponse;
    color: string;
    iconName: string;
    formatCurrency: (amount: number) => string;
    onDelete: () => void;
    expanded: boolean;
    onToggleExpanded: () => void;
}

const ExpenseHistoryItem: React.FC<ExpenseHistoryItemProps> = ({ expense, color, iconName, formatCurrency, onDelete, expanded, onToggleExpanded }) => {
    const hasItems = expense.purchaseType === 'MultiItem' && expense.items?.length > 0;

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const actionTranslateX = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [0, 26, 72],
            extrapolate: 'clamp',
        });

        const bgOpacity = dragX.interpolate({
            inputRange: [-120, -32, 0],
            outputRange: [1, 0.82, 0],
            extrapolate: 'clamp',
        });

        const iconTranslateX = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [0, 10, 22],
            extrapolate: 'clamp',
        });

        const iconScale = dragX.interpolate({
            inputRange: [-120, -40, 0],
            outputRange: [1, 0.92, 0.84],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.swipeDeleteContainer}>
                <Animated.View
                    style={[
                        styles.swipeDeleteBackground,
                        {
                            opacity: bgOpacity,
                            transform: [{ translateX: actionTranslateX }],
                        },
                    ]}
                />
                <TouchableOpacity style={styles.swipeDeleteAction} onPress={onDelete} activeOpacity={0.8}>
                    <Animated.View style={{ opacity: bgOpacity, transform: [{ translateX: iconTranslateX }, { scale: iconScale }] }}>
                        <Feather name="trash-2" size={22} color={colors.white} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2} rightThreshold={40}>
            <View style={styles.expenseRow}>
                <View style={[styles.expenseIconWrap, { backgroundColor: `${color}22` }]}> 
                    <MaterialIcons name={iconName} size={18} color={color} />
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
                    <Text numberOfLines={1} style={styles.expenseDescription}>
                        {expense.description?.trim() || ' '}
                    </Text>
                </View>

                <View style={styles.expenseAmountWrap}>
                    {hasItems ? (
                        <TouchableOpacity style={styles.itemCountPill} onPress={onToggleExpanded} activeOpacity={0.82}>
                            <Text style={styles.itemCountText}>{expense.itemCount} items</Text>
                            <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={15} color="#005232" />
                        </TouchableOpacity>
                    ) : null}
                    <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                </View>
            </View>
            {hasItems && expanded ? (
                <View style={styles.expandedItems}>
                    {expense.items.map((item) => (
                        <View key={item.id} style={styles.expandedItemRow}>
                            <View style={styles.expandedItemCopy}>
                                <Text numberOfLines={1} style={styles.expandedItemName}>{item.name}</Text>
                                <Text style={styles.expandedItemTag}>{item.tag.replace('_', ' ')}</Text>
                            </View>
                            <Text style={styles.expandedItemAmount}>{formatCurrency(item.totalAmount)}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </Swipeable>
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
        color: '#005232',
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
        minHeight: 72,
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
        justifyContent: 'center',
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
        lineHeight: 14,
        marginTop: 3,
        minHeight: 14,
    },
    expenseAmount: {
        color: '#181d19',
        fontSize: 15,
        fontWeight: '800',
    },
    expenseAmountWrap: {
        alignItems: 'flex-end',
        gap: 5,
    },
    itemCountPill: {
        backgroundColor: '#ecf8f0',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    itemCountText: {
        color: '#005232',
        fontSize: 10,
        fontWeight: '800',
    },
    expandedItems: {
        paddingLeft: 52,
        paddingBottom: 10,
        gap: 8,
    },
    expandedItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    expandedItemCopy: {
        flex: 1,
        minWidth: 0,
    },
    expandedItemName: {
        color: '#181d19',
        fontSize: 13,
        fontWeight: '700',
    },
    expandedItemTag: {
        color: '#6f7a71',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    expandedItemAmount: {
        color: '#4f5a53',
        fontSize: 13,
        fontWeight: '800',
    },
    swipeDeleteContainer: {
        width: 112,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    swipeDeleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 112,
        backgroundColor: colors.danger,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
    },
    swipeDeleteAction: {
        width: 112,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
});
