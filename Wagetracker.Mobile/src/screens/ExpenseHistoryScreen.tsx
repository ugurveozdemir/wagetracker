import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
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
import { colors, useResponsiveLayout } from '../theme';
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
    const { horizontalPadding, metrics, rfs, rs, rv } = useResponsiveLayout();
    const {
        weeklyGroups,
        fetchWeeklyGroups,
        loadMoreWeeklyGroups,
        isLoadingWeeklyGroups,
        isLoadingMoreWeeklyGroups,
        hasLoadedWeeklyGroups,
        hasMoreWeeklyGroups,
        deleteExpense,
    } = useExpenseStore();
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

    const sections = useMemo(
        () =>
            weeklyGroups.map((group) => ({
                ...group,
                data: group.expenses,
            })),
        [weeklyGroups]
    );

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

            <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: rv(8, 0.72, 1), paddingBottom: rv(12, 0.74, 1) }]}>
                <TouchableOpacity
                    style={[styles.headerButton, { width: metrics.touchTarget, height: metrics.touchTarget, borderRadius: metrics.touchTarget / 2 }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Feather name="arrow-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: rfs(20, 0.9, 1) }]}>Expense History</Text>
                <View style={[styles.headerButtonPlaceholder, { width: metrics.touchTarget, height: metrics.touchTarget }]} />
            </View>

            <SectionList
                sections={sections}
                style={styles.container}
                contentContainerStyle={[
                    styles.contentContainer,
                    {
                        paddingHorizontal: horizontalPadding,
                        paddingBottom: rv(120, 0.82, 1),
                    },
                ]}
                keyExtractor={(expense) => String(expense.id)}
                refreshing={isLoadingWeeklyGroups && hasLoadedWeeklyGroups}
                onRefresh={fetchWeeklyGroups}
                onEndReached={loadMoreWeeklyGroups}
                onEndReachedThreshold={0.45}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                ListHeaderComponent={
                    <View style={[styles.heroCard, { borderRadius: rs(32, 0.86, 1), padding: rs(28, 0.84, 1), marginBottom: rv(24, 0.74, 1) }]}>
                        <Text style={styles.heroEyebrow}>Weekly Spending Ledger</Text>
                        <Text style={[styles.heroTitle, { fontSize: rfs(30, 0.84, 1), lineHeight: Math.round(rfs(30, 0.84, 1) * 1.14) }]}>Grouped by Monday-start weeks</Text>
                        <Text style={[styles.heroSubcopy, { fontSize: rfs(15, 0.9, 1), lineHeight: Math.round(rfs(15, 0.9, 1) * 1.48) }]}>Tap back any time to return to your all-time expense overview.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.emptyState, { borderRadius: rs(28, 0.86, 1), padding: rs(28, 0.84, 1) }]}>
                        <Text style={[styles.emptyTitle, { fontSize: rfs(22, 0.86, 1) }]}>No expenses yet</Text>
                        <Text style={[styles.emptyText, { fontSize: rfs(15, 0.9, 1), lineHeight: Math.round(rfs(15, 0.9, 1) * 1.48) }]}>Use the floating add action to log your first expense.</Text>
                    </View>
                }
                ListFooterComponent={
                    isLoadingMoreWeeklyGroups ? (
                        <View style={styles.loadMoreFooter}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : hasMoreWeeklyGroups ? (
                        <View style={styles.loadMoreFooter}>
                            <Text style={styles.loadMoreText}>Scroll for older weeks</Text>
                        </View>
                    ) : null
                }
                renderSectionHeader={({ section }) => (
                    <View style={[styles.weekHeaderCard, { paddingHorizontal: rs(22, 0.84, 1), paddingTop: rv(22, 0.78, 1), paddingBottom: rv(16, 0.78, 1), marginTop: rv(16, 0.78, 1) }]}>
                        <View>
                            <Text style={[styles.weekTitle, { fontSize: rfs(20, 0.88, 1) }]}>{formatWeekRange(section.weekStart, section.weekEnd)}</Text>
                            <Text style={[styles.weekMeta, { fontSize: rfs(12, 0.9, 1) }]}>Monday through Sunday</Text>
                        </View>
                        <Text style={[styles.weekAmount, { fontSize: rfs(20, 0.88, 1) }]}>{formatCurrency(section.totalAmount)}</Text>
                    </View>
                )}
                renderItem={({ item: expense, index, section }) => {
                    const category = EXPENSE_CATEGORIES[expense.category] ?? EXPENSE_CATEGORIES[7];
                    return (
                        <ExpenseHistoryItem
                            expense={expense}
                            color={category.color}
                            iconName={categoryIconMap[expense.category] ?? 'receipt-long'}
                            formatCurrency={formatCurrency}
                            onDelete={() => handleDeleteExpense(expense.id, expense.categoryName)}
                            expanded={!!expandedExpenseIds[expense.id]}
                            onToggleExpanded={() => toggleExpenseExpanded(expense.id)}
                            isLastInSection={index === section.data.length - 1}
                        />
                    );
                }}
            />
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
    isLastInSection: boolean;
}

const ExpenseHistoryItem: React.FC<ExpenseHistoryItemProps> = ({ expense, color, iconName, formatCurrency, onDelete, expanded, onToggleExpanded, isLastInSection }) => {
    const hasItems = expense.purchaseType === 'MultiItem' && expense.items?.length > 0;
    const { rfs, rs, rv } = useResponsiveLayout();

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const actionScaleX = dragX.interpolate({
            inputRange: [-124, -40, 0],
            outputRange: [1, 0.56, 0.24],
            extrapolate: 'clamp',
        });

        const actionTranslateX = dragX.interpolate({
            inputRange: [-124, -40, 0],
            outputRange: [0, 23, 40],
            extrapolate: 'clamp',
        });

        const bgOpacity = dragX.interpolate({
            inputRange: [-96, -24, 0],
            outputRange: [1, 0.74, 0],
            extrapolate: 'clamp',
        });

        const iconOpacity = dragX.interpolate({
            inputRange: [-88, -38, 0],
            outputRange: [1, 0.45, 0],
            extrapolate: 'clamp',
        });

        const iconScale = dragX.interpolate({
            inputRange: [-104, -40, 0],
            outputRange: [1, 0.9, 0.72],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.swipeDeleteContainer}>
                <TouchableOpacity style={styles.swipeDeleteAction} onPress={onDelete} activeOpacity={0.84}>
                    <Animated.View
                        style={[
                            styles.swipeDeleteSurface,
                            {
                                opacity: bgOpacity,
                                transform: [{ translateX: actionTranslateX }, { scaleX: actionScaleX }],
                            },
                        ]}
                    >
                        <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: iconScale }] }}>
                            <Feather name="trash-2" size={21} color={colors.white} />
                        </Animated.View>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.expenseItemShell, isLastInSection && styles.expenseItemShellLast]}>
            <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2} rightThreshold={40}>
                <View
                    style={[
                        styles.expenseRow,
                        {
                            minHeight: rv(72, 0.86, 1),
                            paddingHorizontal: rs(22, 0.84, 1),
                            paddingVertical: rv(12, 0.78, 1),
                        },
                        isLastInSection && !expanded && styles.expenseRowLast,
                    ]}
                >
                    <View style={[styles.expenseIconWrap, { width: rs(40, 0.9, 1), height: rs(40, 0.9, 1), borderRadius: rs(20, 0.9, 1), backgroundColor: `${color}22` }]}>
                        <MaterialIcons name={iconName} size={Math.round(rs(18, 0.9, 1))} color={color} />
                    </View>

                    <View style={styles.expenseCopy}>
                        <Text style={[styles.expenseTitle, { fontSize: rfs(15, 0.9, 1) }]}>{expense.categoryName}</Text>
                        <Text style={[styles.expenseMeta, { fontSize: rfs(12, 0.9, 1) }]}>
                            {new Date(expense.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </Text>
                        <Text numberOfLines={1} style={[styles.expenseDescription, { fontSize: rfs(12, 0.9, 1) }]}>
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
                        <Text style={[styles.expenseAmount, { fontSize: rfs(15, 0.9, 1) }]}>-{formatCurrency(expense.amount)}</Text>
                    </View>
                </View>
            </Swipeable>
            {hasItems && expanded ? (
                <View
                    style={[
                        styles.expandedItems,
                        { paddingLeft: rs(52, 0.84, 1), paddingRight: rs(22, 0.84, 1), paddingBottom: rv(10, 0.78, 1) },
                        isLastInSection && styles.expandedItemsLast,
                    ]}
                >
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
        </View>
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
        flexGrow: 1,
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
    weekHeaderCard: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 16,
        marginTop: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
        elevation: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
    expenseItemShell: {
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    expenseItemShellLast: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: 16,
    },
    expenseRow: {
        backgroundColor: '#ffffff',
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5ef',
    },
    expenseRowLast: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
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
        backgroundColor: '#ffffff',
        paddingLeft: 52,
        paddingRight: 22,
        paddingBottom: 10,
        gap: 8,
    },
    expandedItemsLast: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    loadMoreFooter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    loadMoreText: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '700',
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
        width: 116,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    swipeDeleteAction: {
        width: 116,
        height: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingLeft: 8,
    },
    swipeDeleteSurface: {
        width: 104,
        height: '100%',
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 22,
        borderTopRightRadius: 22,
        borderBottomRightRadius: 22,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});
