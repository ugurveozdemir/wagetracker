import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

export type LockedFeature = 'goals' | 'expenses' | 'jobs';
export type LockedPreviewVariant = 'metrics' | 'weeklyLedger';

interface LockedFeatureCopy {
    eyebrow: string;
    title: string;
    body: string;
    icon: string;
    metrics: Array<{
        label: string;
        value: string;
    }>;
    notes: string[];
}

interface LockedFeatureBaseProps {
    feature: LockedFeature;
    onUnlock: () => void;
    previewVariant?: LockedPreviewVariant;
}

interface LockedFeatureCardProps extends LockedFeatureBaseProps {
    compact?: boolean;
    scale?: number;
    style?: StyleProp<ViewStyle>;
}

interface LockedFeatureModalProps extends LockedFeatureBaseProps {
    visible: boolean;
    onClose: () => void;
}

const featureCopy: Record<LockedFeature, LockedFeatureCopy> = {
    goals: {
        eyebrow: 'Premium Goals',
        title: 'Plan the week before it starts.',
        body: 'Preview weekly targets, progress, and remaining income without changing your current setup.',
        icon: 'track-changes',
        metrics: [
            { label: 'Current', value: '$620' },
            { label: 'Target', value: '$900' },
            { label: 'Left', value: '$280' },
        ],
        notes: ['Weekly target preview', 'Progress resets Monday', 'Dashboard goal cards'],
    },
    expenses: {
        eyebrow: 'Premium Expenses',
        title: 'See where the week is going.',
        body: 'Preview spending totals, receipt scans, and weekly history beside your income, then unlock the full ledger.',
        icon: 'receipt-long',
        metrics: [
            { label: 'Food', value: '$84' },
            { label: 'Fuel', value: '$46' },
            { label: 'Other', value: '$32' },
        ],
        notes: ['Receipt scan logging', 'Weekly spend preview', 'Income vs spending'],
    },
    jobs: {
        eyebrow: 'Premium Jobs',
        title: 'Keep every role in one place.',
        body: 'Free accounts keep two jobs unlocked. Premium lets you keep adding roles without hiding older work.',
        icon: 'work',
        metrics: [
            { label: 'Unlocked', value: '2' },
            { label: 'Premium', value: '∞' },
            { label: 'Roles', value: 'All' },
        ],
        notes: ['Unlimited job cards', 'No older roles locked', 'One earnings workspace'],
    },
};

const expenseLedgerPreviewRows = [
    {
        category: 'Food & Drinks',
        date: 'Mon, Apr 8',
        description: 'Lunch and coffee',
        amount: '$84.00',
        color: '#f97316',
        icon: 'restaurant',
    },
    {
        category: 'Transport',
        date: 'Wed, Apr 10',
        description: 'Fuel and rides',
        amount: '$46.00',
        color: '#3b82f6',
        icon: 'directions-car',
    },
    {
        category: 'Bills & Utilities',
        date: 'Fri, Apr 12',
        description: 'Phone and utilities',
        amount: '$32.00',
        color: '#eab308',
        icon: 'lightbulb',
    },
] as const;

const PreviewMetrics: React.FC<{ feature: LockedFeature; compact?: boolean }> = ({ feature, compact = false }) => {
    const copy = featureCopy[feature];

    return (
        <View style={[styles.metricsRow, compact && styles.metricsRowCompact]}>
            {copy.metrics.map((metric) => (
                <View key={metric.label} style={[styles.metricTile, compact && styles.metricTileCompact]}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={[styles.metricValue, compact && styles.metricValueCompact]}>{metric.value}</Text>
                    <View style={styles.metricVeil} />
                </View>
            ))}
        </View>
    );
};

const MetricPreviewPanel: React.FC<{ feature: LockedFeature; compact?: boolean }> = ({ feature, compact = false }) => {
    const copy = featureCopy[feature];

    return (
        <View style={[styles.previewPanel, compact && styles.previewPanelCompact]}>
            <View style={styles.previewTopRow}>
                <View style={styles.previewIcon}>
                    <MaterialIcons name={copy.icon} size={compact ? 18 : 22} color={colors.white} />
                </View>
                <View style={styles.previewPill}>
                    <Text style={styles.previewPillText}>Sample preview</Text>
                </View>
            </View>

            <PreviewMetrics feature={feature} compact={compact} />

            <View style={styles.previewTrack}>
                <View style={[styles.previewFill, feature === 'expenses' && styles.previewFillOrange]} />
            </View>
        </View>
    );
};

const ExpenseWeeklyLedgerPreview: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    return (
        <View style={[styles.ledgerPreviewPanel, compact && styles.ledgerPreviewPanelCompact]}>
            <View style={styles.ledgerPreviewTopRow}>
                <View style={styles.ledgerPreviewIcon}>
                    <MaterialIcons name="receipt-long" size={compact ? 18 : 22} color={colors.white} />
                </View>
                <View style={styles.ledgerPreviewPill}>
                    <Text style={styles.ledgerPreviewPillText}>Sample preview</Text>
                </View>
            </View>

            <View style={styles.ledgerWeekHeader}>
                <View style={styles.ledgerWeekCopy}>
                    <Text style={styles.ledgerWeekTitle}>This Week</Text>
                    <Text style={styles.ledgerWeekMeta}>Monday through Sunday</Text>
                </View>
                <Text style={styles.ledgerWeekAmount}>$162.00</Text>
            </View>

            <View style={styles.ledgerRows}>
                {expenseLedgerPreviewRows.map((expense) => (
                    <View key={expense.category} style={[styles.ledgerExpenseRow, compact && styles.ledgerExpenseRowCompact]}>
                        <View style={[styles.ledgerExpenseIconWrap, { backgroundColor: `${expense.color}22` }]}>
                            <MaterialIcons name={expense.icon} size={compact ? 14 : 16} color={expense.color} />
                        </View>
                        <View style={styles.ledgerExpenseCopy}>
                            <Text numberOfLines={1} style={styles.ledgerExpenseTitle}>{expense.category}</Text>
                            <Text numberOfLines={1} style={styles.ledgerExpenseMeta}>{expense.date}</Text>
                            {compact ? null : (
                                <Text numberOfLines={1} style={styles.ledgerExpenseDescription}>{expense.description}</Text>
                            )}
                        </View>
                        <Text style={styles.ledgerExpenseAmount}>-{expense.amount}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.ledgerPreviewTrack}>
                <View style={styles.ledgerPreviewFill} />
            </View>
        </View>
    );
};

const PreviewPanel: React.FC<{
    feature: LockedFeature;
    compact?: boolean;
    variant?: LockedPreviewVariant;
}> = ({ feature, compact = false, variant = 'metrics' }) => {
    if (feature === 'expenses' && variant === 'weeklyLedger') {
        return <ExpenseWeeklyLedgerPreview compact={compact} />;
    }

    return <MetricPreviewPanel feature={feature} compact={compact} />;
};

const UnlockButton: React.FC<{ onPress?: () => void; asView?: boolean }> = ({ onPress, asView = false }) => {
    const content = (
        <>
            <MaterialIcons name="workspace-premium" size={18} color={colors.white} />
            <Text style={styles.unlockButtonText}>Unlock Premium</Text>
        </>
    );

    if (asView) {
        return <View style={styles.unlockButton}>{content}</View>;
    }

    return (
        <TouchableOpacity style={styles.unlockButton} activeOpacity={0.88} onPress={onPress}>
            {content}
        </TouchableOpacity>
    );
};

export const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
    feature,
    onUnlock,
    compact = false,
    scale = 1,
    previewVariant = 'metrics',
    style,
}) => {
    const copy = featureCopy[feature];

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    borderRadius: 28 * scale,
                    padding: 22 * scale,
                    marginTop: 18 * scale,
                },
                style,
            ]}
            activeOpacity={0.9}
            onPress={onUnlock}
        >
            <View style={styles.cardGlow} />
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                    <Text style={styles.cardEyebrow}>{copy.eyebrow}</Text>
                    <Text style={[styles.cardTitle, { fontSize: compact ? 24 : 28 }]}>{copy.title}</Text>
                </View>
                <View style={styles.lockBadge}>
                    <MaterialIcons name="lock" size={18} color={colors.secondaryContainer} />
                </View>
            </View>

            <PreviewPanel feature={feature} compact={compact} variant={previewVariant} />

            <Text style={styles.cardBody}>{copy.body}</Text>
            <UnlockButton asView />
        </TouchableOpacity>
    );
};

export const LockedFeatureScreen: React.FC<LockedFeatureBaseProps> = ({ feature, onUnlock, previewVariant = 'metrics' }) => {
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const copy = featureCopy[feature];

    return (
        <SafeAreaView style={styles.screenSafeArea}>
            <ScrollView
                style={styles.screenContainer}
                contentContainerStyle={[
                    styles.screenContent,
                    {
                        paddingHorizontal: compact ? 18 : 24,
                        paddingTop: compact ? 16 : 24,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.screenHero}>
                    <View style={styles.screenLockCircle}>
                        <MaterialIcons name="lock" size={26} color={colors.secondaryContainer} />
                    </View>
                    <Text style={styles.screenEyebrow}>{copy.eyebrow}</Text>
                    <Text style={[styles.screenTitle, { fontSize: compact ? 30 : 36 }]}>{copy.title}</Text>
                    <Text style={styles.screenBody}>{copy.body}</Text>
                    <PreviewPanel feature={feature} compact={compact} variant={previewVariant} />
                    <View style={styles.notesStack}>
                        {copy.notes.map((note) => (
                            <View key={note} style={styles.noteRow}>
                                <MaterialIcons name="check-circle" size={18} color={colors.primaryLight} />
                                <Text style={styles.noteText}>{note}</Text>
                            </View>
                        ))}
                    </View>
                    <UnlockButton onPress={onUnlock} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export const LockedFeatureModal: React.FC<LockedFeatureModalProps> = ({
    visible,
    feature,
    onClose,
    onUnlock,
    previewVariant = 'metrics',
}) => {
    const copy = featureCopy[feature];

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation()}>
                    <TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.82} onPress={onClose}>
                        <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <View style={styles.modalIcon}>
                        <MaterialIcons name={copy.icon} size={26} color={colors.white} />
                    </View>
                    <Text style={styles.modalEyebrow}>{copy.eyebrow}</Text>
                    <Text style={styles.modalTitle}>{copy.title}</Text>
                    <Text style={styles.modalBody}>{copy.body}</Text>
                    {feature === 'expenses' && previewVariant === 'weeklyLedger' ? (
                        <PreviewPanel feature={feature} compact variant={previewVariant} />
                    ) : (
                        <PreviewMetrics feature={feature} compact />
                    )}
                    <UnlockButton onPress={onUnlock} />
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: colors.primary,
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.14,
        shadowRadius: 32,
        elevation: 10,
    },
    cardGlow: {
        position: 'absolute',
        right: -34,
        top: -34,
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: 'rgba(254,94,30,0.30)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 18,
    },
    cardHeaderCopy: {
        flex: 1,
    },
    cardEyebrow: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    cardTitle: {
        color: colors.white,
        fontWeight: '800',
        lineHeight: 32,
    },
    lockBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 14,
        lineHeight: 21,
        marginTop: 16,
        marginBottom: 16,
    },
    previewPanel: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: 16,
    },
    previewPanelCompact: {
        borderRadius: 20,
        padding: 14,
    },
    previewTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    previewIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewPill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    previewPillText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '800',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    metricsRowCompact: {
        gap: 8,
    },
    metricTile: {
        flex: 1,
        minHeight: 72,
        borderRadius: 18,
        backgroundColor: colors.white,
        padding: 12,
        overflow: 'hidden',
    },
    metricTileCompact: {
        minHeight: 64,
        padding: 10,
        borderRadius: 16,
    },
    metricLabel: {
        color: colors.onSurfaceVariant,
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    metricValue: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: '900',
    },
    metricValueCompact: {
        fontSize: 17,
    },
    metricVeil: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: 10,
        height: 6,
        borderRadius: 999,
        backgroundColor: colors.surfaceContainerHigh,
    },
    ledgerPreviewPanel: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 24,
        padding: 14,
    },
    ledgerPreviewPanelCompact: {
        borderRadius: 20,
        padding: 12,
    },
    ledgerPreviewTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ledgerPreviewIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.secondaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ledgerPreviewPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.orangeBg,
    },
    ledgerPreviewPillText: {
        color: colors.secondary,
        fontSize: 10,
        fontWeight: '800',
    },
    ledgerWeekHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10,
    },
    ledgerWeekCopy: {
        flex: 1,
        minWidth: 0,
    },
    ledgerWeekTitle: {
        color: colors.onSurface,
        fontSize: 16,
        fontWeight: '900',
    },
    ledgerWeekMeta: {
        color: colors.outline,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    ledgerWeekAmount: {
        color: colors.secondary,
        fontSize: 16,
        fontWeight: '900',
    },
    ledgerRows: {
        gap: 8,
    },
    ledgerExpenseRow: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceContainerHigh,
    },
    ledgerExpenseRowCompact: {
        minHeight: 44,
        gap: 8,
    },
    ledgerExpenseIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ledgerExpenseCopy: {
        flex: 1,
        minWidth: 0,
    },
    ledgerExpenseTitle: {
        color: colors.onSurface,
        fontSize: 12,
        fontWeight: '800',
    },
    ledgerExpenseMeta: {
        color: colors.outline,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 1,
    },
    ledgerExpenseDescription: {
        color: colors.onSurfaceVariant,
        fontSize: 10,
        marginTop: 1,
    },
    ledgerExpenseAmount: {
        color: colors.onSurface,
        fontSize: 12,
        fontWeight: '900',
    },
    ledgerPreviewTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: colors.orangeBg,
        overflow: 'hidden',
        marginTop: 12,
    },
    ledgerPreviewFill: {
        width: '54%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: colors.secondaryContainer,
    },
    previewTrack: {
        height: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
        marginTop: 14,
    },
    previewFill: {
        width: '68%',
        height: '100%',
        backgroundColor: colors.primarySoft,
        borderRadius: 999,
    },
    previewFillOrange: {
        width: '44%',
        backgroundColor: colors.secondarySoft,
    },
    unlockButton: {
        minHeight: 50,
        borderRadius: 25,
        backgroundColor: colors.secondaryContainer,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 18,
    },
    unlockButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '900',
    },
    screenSafeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    screenContainer: {
        flex: 1,
    },
    screenContent: {
        paddingBottom: 130,
    },
    screenHero: {
        alignItems: 'stretch',
        gap: 16,
    },
    screenLockCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    screenEyebrow: {
        color: colors.secondary,
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    screenTitle: {
        color: colors.primary,
        fontWeight: '900',
        lineHeight: 40,
        textAlign: 'center',
    },
    screenBody: {
        color: colors.onSurfaceVariant,
        fontSize: 15,
        lineHeight: 23,
        textAlign: 'center',
    },
    notesStack: {
        gap: 10,
        marginBottom: 4,
    },
    noteRow: {
        minHeight: 42,
        borderRadius: 21,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    noteText: {
        color: colors.onSurface,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(24,29,25,0.46)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalPanel: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 28,
        backgroundColor: colors.surfaceBright,
        padding: 22,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.24,
        shadowRadius: 36,
        elevation: 14,
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceContainer,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
    },
    modalIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
        marginBottom: 14,
    },
    modalEyebrow: {
        color: colors.secondary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    modalTitle: {
        color: colors.primary,
        fontSize: 27,
        lineHeight: 32,
        fontWeight: '900',
        marginBottom: 10,
    },
    modalBody: {
        color: colors.onSurfaceVariant,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
});
