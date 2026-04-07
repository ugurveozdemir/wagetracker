import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES } from '../types';
import { colors } from '../theme';

export const ExpensesScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const { expenses, fetchExpenses } = useExpenseStore();
    const [refreshing, setRefreshing] = useState(false);
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);
    const horizontalPadding = compact ? 18 : 24;

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

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const monthlyTotal = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

    const categoryTotals = useMemo(() => {
        const totals = new Map<number, number>();
        expenses.forEach((expense) => {
            totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
        });
        return totals;
    }, [expenses]);

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

        return Array.from(categoryTotals.entries())
            .filter(([, amount]) => amount > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([categoryId, amount], index) => {
                const category = EXPENSE_CATEGORIES[categoryId] ?? EXPENSE_CATEGORIES[7];
                return {
                    label: category.name,
                    amount,
                    icon: iconMap[categoryId] ?? 'receipt-long',
                    tint: tintMap[categoryId] ?? '#eae8e0',
                    tone: toneMap[categoryId] ?? '#4f5a53',
                    wide: index === 3,
                };
            });
    }, [categoryTotals]);

    const recentItems = useMemo(
        () =>
            expenses.slice(0, 4).map((expense, index) => {
                const category = EXPENSE_CATEGORIES[expense.category] ?? EXPENSE_CATEGORIES[7];
                const iconMap = ['shopping-bag', 'local-taxi', 'bolt', 'receipt-long'] as const;
                const bgMap = ['rgba(255,220,196,0.30)', 'rgba(217,226,255,0.60)', 'rgba(156,245,193,0.30)', 'rgba(255,220,196,0.30)'];
                const iconColorMap = ['#ab3600', '#00429B', '#006D44', '#ab3600'];

                return {
                    id: expense.id,
                    title: category.name,
                    meta: new Date(expense.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    }),
                    description: expense.description?.trim() || '',
                    amount: `-${formatCurrency(expense.amount)}`,
                    icon: iconMap[index] ?? 'shopping-bag',
                    iconBg: bgMap[index] ?? 'rgba(255,220,196,0.30)',
                    iconColor: iconColorMap[index] ?? '#ab3600',
                };
            }),
        [expenses]
    );

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
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatarDot} />
                        </View>
                        <Text style={styles.brandText}>The Kinetic Ledger</Text>
                    </View>

                    <View style={styles.currencyPill}>
                        <Text style={styles.currencyText}>USD ($)</Text>
                    </View>
                </View>

                <View style={[styles.heroCard, { borderRadius: 40 * scale, padding: 32 * scale }]}>
                    <Text style={styles.heroLabel}>TOTAL MONTHLY SPENDING</Text>
                    <Text style={[styles.heroValue, { fontSize: compact ? 44 : 52 }]}>{formatCurrency(monthlyTotal)}</Text>
                    <View style={styles.heroGhost}>
                        <MaterialIcons name="receipt-long" size={88} color="rgba(65,33,0,0.10)" />
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Breakdown</Text>
                    <View style={styles.monthPill}>
                        <Text style={styles.monthText}>{currentMonthLabel}</Text>
                    </View>
                </View>

                <View style={[styles.breakdownGrid, { gap: 14 * scale }]}>
                    {breakdownCards.map((card) => (
                        <View
                            key={card.label}
                            style={[
                                styles.breakdownCard,
                                card.wide && styles.breakdownCardWide,
                                {
                                    borderRadius: 30 * scale,
                                    padding: 24 * scale,
                                },
                            ]}
                        >
                            <View style={[styles.breakdownIcon, { backgroundColor: card.tint }]}>
                                <MaterialIcons name={card.icon} size={24} color={card.tone} />
                            </View>
                            <View style={card.wide ? styles.breakdownWideRow : undefined}>
                                <View>
                                    <Text style={styles.breakdownLabel}>{card.label}</Text>
                                    <Text style={[styles.breakdownValue, { color: card.tone }]}>{formatCurrency(card.amount)}</Text>
                                </View>
                                {card.wide ? (
                                    <View style={styles.breakdownProgressTrack}>
                                        <View style={styles.breakdownProgressFill} />
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.recentPanel, { borderRadius: 40 * scale, padding: 28 * scale }]}>
                    <Text style={[styles.sectionTitle, styles.recentTitleHeading, { fontSize: compact ? 24 : 27 }]}>Recent Spending</Text>

                    <View style={styles.recentList}>
                        {recentItems.map((item) => (
                            <View key={item.id} style={[styles.recentItem, { borderRadius: 24 * scale, padding: 20 * scale }]}>
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
                                        {item.description ? (
                                            <Text
                                                numberOfLines={1}
                                                style={[styles.recentDescription, { fontSize: compact ? 10 : 11 }]}
                                            >
                                                {item.description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={styles.recentAmountWrap}>
                                    <Text style={[styles.recentAmount, { fontSize: compact ? 15 : 16 }]}>{item.amount}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#263746',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
    },
    brandText: {
        color: '#006D44',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    currencyPill: {
        backgroundColor: '#efeee5',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    currencyText: {
        color: '#6f7a71',
        fontSize: 12,
        fontWeight: '700',
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
        marginBottom: 18,
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
    breakdownCardWide: {
        backgroundColor: '#e4e3da',
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
    breakdownWideRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    breakdownProgressTrack: {
        width: 120,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#d2d8d1',
        overflow: 'hidden',
    },
    breakdownProgressFill: {
        width: '65%',
        height: '100%',
        backgroundColor: '#ff8a00',
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
    },
    recentAmountWrap: {
        width: 76,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
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
    },
    recentAmount: {
        color: '#ab3600',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
        textAlign: 'right',
    },
});
