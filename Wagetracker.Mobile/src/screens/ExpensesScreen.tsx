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
    useWindowDimensions,
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
import { colors } from '../theme';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';

type ExpensesNavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'Expenses'>;
const brandLogo = require('../../assets/logo.png');

export const ExpensesScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const navigation = useNavigation<ExpensesNavigationProp>();
    const { summary, fetchSummary, deleteExpense, isLoadingSummary, hasLoadedSummary } = useExpenseStore();
    const [refreshing, setRefreshing] = useState(false);
    const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<number, boolean>>({});
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);
    const horizontalPadding = compact ? 18 : 24;

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
                    paddingTop: 12,
                    paddingBottom: 168,
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topBar}>
                    <View style={styles.brandRow}>
                        <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
                        <Text style={styles.brandText}>Chickaree</Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => navigation.navigate('ExpenseHistory')}
                    style={[styles.heroCard, { borderRadius: 40 * scale, padding: 32 * scale }]}
                >
                    <Text style={styles.heroLabel}>TOTAL SPENDING TO DATE</Text>
                    <Text style={[styles.heroValue, { fontSize: compact ? 44 : 52 }]}>{formatCurrency(totalSpending)}</Text>
                    <Text style={styles.heroSubtext}>Tap to view every expense grouped by Monday-start weeks.</Text>
                    <View style={styles.heroGhost}>
                        <MaterialIcons name="receipt-long" size={88} color="rgba(65,33,0,0.10)" />
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Breakdown</Text>
                    <View style={styles.monthPill}>
                        <Text style={styles.monthText}>{currentMonthLabel}</Text>
                    </View>
                </View>

                <View style={[styles.breakdownGrid, { gap: 14 * scale }]}>
                    {breakdownCards.length === 0 ? (
                        <View style={[styles.emptyState, { borderRadius: 30 * scale, padding: 24 * scale }]}>
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
                                        borderRadius: 30 * scale,
                                        padding: 24 * scale,
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

                <View style={[styles.recentPanel, { borderRadius: 40 * scale, padding: 28 * scale }]}>
                    <Text style={[styles.sectionTitle, styles.recentTitleHeading, { fontSize: compact ? 24 : 27 }]}>Recent Spending</Text>

                    <View style={styles.recentList}>
                        {recentItems.map((item) => (
                            <RecentExpenseItem
                                key={item.id}
                                item={item}
                                compact={compact}
                                scale={scale}
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
    scale: number;
    onDelete: () => void;
    expanded: boolean;
    onToggleExpanded: () => void;
    formatCurrency: (amount: number) => string;
}

const RecentExpenseItem: React.FC<RecentExpenseItemProps> = ({ item, compact, scale, onDelete, expanded, onToggleExpanded, formatCurrency }) => {
    const hasItems = item.expense.purchaseType === 'MultiItem' && item.expense.items?.length > 0;

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
            <View style={[styles.recentItem, { borderRadius: 24 * scale, padding: 20 * scale }]}> 
                <View style={styles.recentLeft}>
                    <View style={[styles.recentIconWrap, { backgroundColor: item.iconBg }]}> 
                        <MaterialIcons name={item.icon} size={24} color={item.iconColor} />
                    </View>

                    <View style={styles.recentCopy}>
                        <Text
                            numberOfLines={1}
                            style={[styles.recentTitle, { fontSize: compact ? 15 : 16 }]}
                        >
                            {item.title}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={[styles.recentMeta, { fontSize: compact ? 10 : 11 }]}
                        >
                            {item.meta}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={[styles.recentDescription, { fontSize: compact ? 10 : 11 }]}
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
                    <Text style={[styles.recentAmount, { fontSize: compact ? 15 : 16 }]}>{item.amount}</Text>
                </View>
            </View>
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
    recentItem: {
        backgroundColor: '#ffffff',
        height: 92,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
    },
    swipeDeleteAction: {
        width: 112,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
});
