import React, { useCallback, useMemo, useState } from 'react';
import {
    Image,
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Alert,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useExpenseStore } from '../stores';
import { ExpenseResponse, ExpenseStackParamList } from '../types';
import { colors, useResponsiveLayout } from '../theme';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';

type ExpensesNavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'Expenses'>;
const brandLogo = require('../../assets/logo.png');

export const ExpensesScreen: React.FC = () => {
    const { horizontalPadding, isCompact: compact, rfs, rs, rv } = useResponsiveLayout();
    const navigation = useNavigation<ExpensesNavigationProp>();
    const { summary, fetchSummary, deleteExpense, isLoadingSummary, hasLoadedSummary } = useExpenseStore();
    const [refreshing, setRefreshing] = useState(false);
    const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<number, boolean>>({});
    useFocusEffect(
        useCallback(() => {
            fetchSummary({ silent: hasLoadedSummary });
        }, [fetchSummary, hasLoadedSummary])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSummary();
        setRefreshing(false);
    }, [fetchSummary]);

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const totalSpending = summary?.totalSpending ?? 0;

    const currentMonthLabel = useMemo(
        () =>
            new Date().toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
            }),
        []
    );

    const breakdownCards = useMemo(() => {
        const iconMap: Record<number, string> = {
            0: 'restaurant',
            1: 'directions-car',
            2: 'shopping-bag',
            3: 'lightbulb',
            4: 'theater-comedy',
            5: 'local-hospital',
            6: 'school',
            7: 'receipt-long',
        };

        const tintMap: Record<number, string> = {
            0: '#ffdcc4',
            1: '#d9e2ff',
            2: '#efe0ff',
            3: '#fff1bf',
            4: '#ffffff',
            5: '#d5f7e3',
            6: '#d7f5fb',
            7: '#eae8e0',
        };

        const toneMap: Record<number, string> = {
            0: '#ab3600',
            1: '#00429B',
            2: '#6f42c1',
            3: '#8a6200',
            4: '#181d19',
            5: colors.primary,
            6: '#006a7a',
            7: '#4f5a53',
        };

        return (summary?.categoryTotals ?? [])
            .slice(0, 4)
            .map((categoryTotal) => {
                const categoryId = categoryTotal.category;
                return {
                    label: categoryTotal.categoryName,
                    amount: categoryTotal.amount,
                    icon: iconMap[categoryId] ?? 'receipt-long',
                    tint: tintMap[categoryId] ?? '#eae8e0',
                    tone: toneMap[categoryId] ?? '#4f5a53',
                };
            });
    }, [summary]);

    const recentItems = useMemo(
        () =>
            (summary?.recentExpenses ?? []).map((expense, index) => {
                const iconMap = ['shopping-bag', 'local-taxi', 'bolt', 'receipt-long'] as const;
                const bgMap = ['rgba(255,220,196,0.30)', 'rgba(217,226,255,0.60)', 'rgba(156,245,193,0.30)', 'rgba(255,220,196,0.30)'];
                const iconColorMap = ['#ab3600', '#00429B', '#005232', '#ab3600'];

                return {
                    id: expense.id,
                    title: expense.categoryName,
                    meta: new Date(expense.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    }),
                    description: expense.description?.trim() || '',
                    amount: `-${formatCurrency(expense.amount)}`,
                    icon: iconMap[index] ?? 'shopping-bag',
                    iconBg: bgMap[index] ?? 'rgba(255,220,196,0.30)',
                    iconColor: iconColorMap[index] ?? '#ab3600',
                    expense,
                };
            }),
        [summary]
    );

    const toggleExpenseExpanded = (expenseId: number) => {
        setExpandedExpenseIds((state) => ({
            ...state,
            [expenseId]: !state[expenseId],
        }));
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

    if (isLoadingSummary && !hasLoadedSummary) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fbf9f1" />
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: rv(12, 0.74, 1),
                    paddingBottom: rv(164, 0.82, 1),
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.topBar, { marginBottom: rv(18, 0.78, 1) }]}>
                    <View style={styles.brandRow}>
                        <Image source={brandLogo} style={[styles.brandLogo, { width: rs(32, 0.9, 1), height: rs(32, 0.9, 1) }]} resizeMode="contain" />
                        <Text style={[styles.brandText, { fontSize: rfs(20, 0.9, 1) }]}>Chickaree</Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => navigation.navigate('ExpenseHistory')}
                    style={[styles.heroCard, { borderRadius: rs(40, 0.84, 1), padding: rs(32, 0.82, 1), marginBottom: rv(24, 0.74, 1) }]}
                >
                    <Text style={styles.heroLabel}>TOTAL SPENDING TO DATE</Text>
                    <Text style={[styles.heroValue, { fontSize: rfs(compact ? 44 : 52, 0.82, 1) }]}>{formatCurrency(totalSpending)}</Text>
                    <Text style={[styles.heroSubtext, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.55) }]}>Tap to view every expense grouped by Monday-start weeks.</Text>
                    <View style={styles.heroGhost}>
                        <MaterialIcons name="receipt-long" size={Math.round(rs(88, 0.82, 1))} color="rgba(65,33,0,0.10)" />
                    </View>
                </TouchableOpacity>

                <View style={[styles.sectionHeader, { marginBottom: rv(16, 0.78, 1) }]}>
                    <Text style={[styles.sectionTitle, { fontSize: rfs(32, 0.84, 1) }]}>Breakdown</Text>
                    <View style={styles.monthPill}>
                        <Text style={styles.monthText}>{currentMonthLabel}</Text>
                    </View>
                </View>

                <View style={[styles.breakdownGrid, { gap: rv(14, 0.78, 1), marginBottom: rv(26, 0.78, 1) }]}>
                    {breakdownCards.length === 0 ? (
                        <View style={[styles.emptyState, { borderRadius: rs(30, 0.84, 1), padding: rs(24, 0.84, 1) }]}>
                            <Text style={styles.emptyTitle}>No expenses yet</Text>
                            <Text style={styles.emptyText}>Use the add button to log your first expense.</Text>
                        </View>
                    ) : (
                        breakdownCards.map((card) => (
                            <View
                                key={card.label}
                                style={[
                                    styles.breakdownCard,
                                    {
                                        borderRadius: rs(30, 0.84, 1),
                                        padding: rs(24, 0.84, 1),
                                    },
                                ]}
                            >
                                <View style={[styles.breakdownIcon, { backgroundColor: card.tint }]}>
                                    <MaterialIcons name={card.icon} size={24} color={card.tone} />
                                </View>
                                <View>
                                    <Text style={styles.breakdownLabel}>{card.label}</Text>
                                    <Text style={[styles.breakdownValue, { color: card.tone }]}>{formatCurrency(card.amount)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={[styles.recentPanel, { borderRadius: rs(40, 0.84, 1), padding: rs(28, 0.84, 1) }]}>
                    <Text style={[styles.sectionTitle, styles.recentTitleHeading, { fontSize: rfs(compact ? 24 : 27, 0.86, 1), marginBottom: rv(16, 0.78, 1) }]}>Recent Spending</Text>

                    <View style={styles.recentList}>
                        {recentItems.map((item) => (
                            <RecentExpenseItem
                                key={item.id}
                                item={item}
                                compact={compact}
                                onDelete={() => handleDeleteExpense(item.id, item.title)}
                                expanded={!!expandedExpenseIds[item.id]}
                                onToggleExpanded={() => toggleExpenseExpanded(item.id)}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

interface RecentExpenseItemProps {
    item: {
        id: number;
        title: string;
        meta: string;
        description: string;
        amount: string;
        icon: string;
        iconBg: string;
        iconColor: string;
        expense: ExpenseResponse;
    };
    compact: boolean;
    onDelete: () => void;
    expanded: boolean;
    onToggleExpanded: () => void;
    formatCurrency: (amount: number) => string;
}

const RecentExpenseItem: React.FC<RecentExpenseItemProps> = ({ item, compact, onDelete, expanded, onToggleExpanded, formatCurrency }) => {
    const hasItems = item.expense.purchaseType === 'MultiItem' && item.expense.items?.length > 0;
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
        <View style={[styles.recentItemShell, { borderRadius: rs(24, 0.86, 1) }]}>
            <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2} rightThreshold={40}>
                <View
                    style={[
                        styles.recentItem,
                        { borderRadius: rs(24, 0.86, 1), padding: rs(20, 0.84, 1), height: rv(92, 0.86, 1) },
                        hasItems && expanded && styles.recentItemExpanded,
                    ]}
                >
                    <View style={styles.recentLeft}>
                        <View style={[styles.recentIconWrap, { width: rs(48, 0.86, 1), height: rs(48, 0.86, 1), borderRadius: rs(24, 0.86, 1), backgroundColor: item.iconBg }]}>
                            <MaterialIcons name={item.icon} size={Math.round(rs(24, 0.86, 1))} color={item.iconColor} />
                        </View>

                        <View style={styles.recentCopy}>
                            <Text
                                numberOfLines={1}
                                style={[styles.recentTitle, { fontSize: rfs(compact ? 15 : 16, 0.9, 1) }]}
                            >
                                {item.title}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={[styles.recentMeta, { fontSize: rfs(compact ? 10 : 11, 0.92, 1) }]}
                            >
                                {item.meta}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={[styles.recentDescription, { fontSize: rfs(compact ? 10 : 11, 0.92, 1) }]}
                            >
                                {item.description || ' '}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.recentAmountWrap}>
                        {hasItems ? (
                            <TouchableOpacity style={styles.itemCountPill} onPress={onToggleExpanded} activeOpacity={0.82}>
                                <Text style={styles.itemCountText}>{item.expense.itemCount} items</Text>
                                <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={15} color="#005232" />
                            </TouchableOpacity>
                        ) : null}
                        <Text style={[styles.recentAmount, { fontSize: rfs(compact ? 15 : 16, 0.9, 1) }]}>{item.amount}</Text>
                    </View>
                </View>
            </Swipeable>
            {hasItems && expanded ? (
                <View style={styles.expandedItems}>
                    {item.expense.items.map((expenseItem) => (
                        <View key={expenseItem.id} style={styles.expandedItemRow}>
                            <View style={styles.expandedItemCopy}>
                                <Text numberOfLines={1} style={styles.expandedItemName}>{expenseItem.name}</Text>
                                <Text style={styles.expandedItemTag}>{expenseItem.tag.replace('_', ' ')}</Text>
                            </View>
                            <Text style={styles.expandedItemAmount}>{formatCurrency(expenseItem.totalAmount)}</Text>
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
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.01,
        flexShrink: 1,
    },
    brandLogo: {
        width: 32,
        height: 32,
    },
    brandText: {
        color: '#005232',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    heroCard: {
        backgroundColor: '#ff8a00',
        marginBottom: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    heroLabel: {
        color: 'rgba(65,33,0,0.80)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.7,
        marginBottom: 8,
    },
    heroValue: {
        color: '#412100',
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 10,
    },
    heroSubtext: {
        color: 'rgba(65,33,0,0.80)',
        fontSize: 14,
        lineHeight: 22,
        maxWidth: '78%',
    },
    heroGhost: {
        position: 'absolute',
        right: 16,
        top: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#181d19',
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    monthPill: {
        backgroundColor: '#fff1e8',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    monthText: {
        color: '#ab3600',
        fontSize: 12,
        fontWeight: '700',
    },
    breakdownGrid: {
        marginBottom: 26,
    },
    breakdownCard: {
        backgroundColor: '#f5f4eb',
    },
    emptyState: {
        backgroundColor: '#f5f4eb',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 132,
    },
    emptyTitle: {
        color: '#181d19',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    emptyText: {
        color: '#6f7a71',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    breakdownIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    breakdownLabel: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.7,
    },
    recentPanel: {
        backgroundColor: '#f5f4eb',
        marginBottom: 12,
    },
    recentHeader: {
        alignItems: 'flex-end',
        gap: 12,
    },
    recentTitleHeading: {
        marginBottom: 16,
    },
    recentList: {
        gap: 14,
    },
    recentItemShell: {
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    recentItem: {
        backgroundColor: '#ffffff',
        height: 92,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recentItemExpanded: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    recentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
        minWidth: 0,
        paddingRight: 12,
    },
    recentCopy: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    recentAmountWrap: {
        width: 96,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
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
    recentIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentTitle: {
        color: '#181d19',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    recentMeta: {
        color: '#6f7a71',
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 13,
    },
    recentDescription: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 13,
        marginTop: 2,
        minHeight: 13,
    },
    recentAmount: {
        color: '#ab3600',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
        textAlign: 'right',
    },
    expandedItems: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 8,
    },
    expandedItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5ef',
        paddingTop: 8,
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
        borderTopLeftRadius: 24,
        borderBottomLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});
