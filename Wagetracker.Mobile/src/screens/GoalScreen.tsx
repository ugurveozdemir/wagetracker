import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Button, Input } from '../components/ui';
import { useJobsStore } from '../stores';
import { profileApi } from '../api';
import { colors, useResponsiveLayout } from '../theme';

const RING_SEGMENTS = 40;
const RING_SIZE = 240;
const RING_RADIUS = 92;

const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const GoalScreen: React.FC = () => {
    const { horizontalPadding, rfs, rs, rv } = useResponsiveLayout();
    const { summary, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const [goalInput, setGoalInput] = useState('');
    const [motivationQuoteInput, setMotivationQuoteInput] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [isSavingQuote, setIsSavingQuote] = useState(false);

    const targetAmount = summary?.weeklyGoal?.targetAmount ?? null;
    const motivationQuote = summary?.weeklyGoal?.motivationQuote ?? null;
    const currentAmount = summary?.weeklyGoal?.currentAmount ?? 0;
    const progressPercent = Math.max(0, Math.min(summary?.weeklyGoal?.progressPercent ?? 0, 100));
    const remainingAmount = summary?.weeklyGoal?.remainingAmount ?? 0;
    const activeSegments = Math.round((progressPercent / 100) * RING_SEGMENTS);
    const ringSize = rs(RING_SIZE, 0.82, 1);
    const ringRadius = ringSize * (RING_RADIUS / RING_SIZE);
    const segmentHeight = rs(34, 0.84, 1);
    const ringCenterSize = rs(154, 0.84, 1);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard({ silent: hasLoadedDashboard });
        }, [fetchDashboard, hasLoadedDashboard])
    );

    useEffect(() => {
        setGoalInput(targetAmount != null ? String(targetAmount) : '');
        setMotivationQuoteInput(motivationQuote ?? '');
    }, [targetAmount, motivationQuote]);

    const ringSegments = useMemo(
        () => Array.from({ length: RING_SEGMENTS }, (_, index) => index),
        []
    );

    const handleSaveGoal = async () => {
        const trimmedValue = goalInput.trim();
        const parsedGoal = trimmedValue.length === 0 ? null : Number(trimmedValue);

        if (parsedGoal != null && (!Number.isFinite(parsedGoal) || parsedGoal < 0)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Goal',
                text2: 'Please enter a valid dollar amount.',
            });
            return;
        }

        try {
            setIsSavingGoal(true);
            await profileApi.updateWeeklyGoal({
                targetAmount: parsedGoal,
                motivationQuote: motivationQuote,
            });
            await fetchDashboard();
            Toast.show({
                type: 'success',
                text1: 'Goal Updated',
                text2: parsedGoal == null ? 'This week no longer has a target.' : 'Your weekly target was saved.',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Save Failed',
                text2: error instanceof Error ? error.message : 'Could not update your weekly goal.',
            });
        } finally {
            setIsSavingGoal(false);
        }
    };

    const handleSaveQuote = async () => {
        const trimmedQuote = motivationQuoteInput.trim();

        try {
            setIsSavingQuote(true);
            await profileApi.updateWeeklyGoal({
                targetAmount: targetAmount,
                motivationQuote: trimmedQuote.length ? trimmedQuote : null,
            });
            await fetchDashboard();
            Toast.show({
                type: 'success',
                text1: 'Quote Updated',
                text2: trimmedQuote.length ? 'Your motivation quote was saved.' : 'Your motivation quote was cleared.',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Save Failed',
                text2: error instanceof Error ? error.message : 'Could not update your motivation quote.',
            });
        } finally {
            setIsSavingQuote(false);
        }
    };

    if (isLoading && !hasLoadedDashboard) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.contentContainer,
                    {
                        paddingHorizontal: horizontalPadding,
                        paddingTop: rv(18, 0.74, 1),
                        paddingBottom: rv(120, 0.82, 1),
                        gap: rv(20, 0.78, 1),
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.screenHeader}>
                    <Text style={[styles.screenTitle, { fontSize: rfs(38, 0.84, 1) }]}>My Goal</Text>
                </View>

                <View style={[styles.heroCard, { borderRadius: rs(32, 0.86, 1), padding: rs(28, 0.84, 1) }]}>
                    <Text style={styles.eyebrow}>Weekly Goal</Text>
                    <Text style={[styles.title, { fontSize: rfs(30, 0.84, 1), lineHeight: Math.round(rfs(30, 0.84, 1) * 1.14) }]}>Progress resets automatically every Monday.</Text>

                    <View style={[styles.ringWrap, { marginVertical: rv(28, 0.74, 1) }]}>
                        <View style={[styles.ringBase, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
                            {ringSegments.map((segment) => {
                                const rotation = `${(360 / RING_SEGMENTS) * segment}deg`;
                                const isActive = segment < activeSegments;

                                return (
                                    <View
                                        key={segment}
                                        style={[
                                            styles.segmentOrbit,
                                            {
                                                width: ringSize,
                                                height: ringSize,
                                                transform: [{ rotate: rotation }],
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.segment,
                                                {
                                                    width: rs(12, 0.86, 1),
                                                    height: segmentHeight,
                                                    marginTop: ringSize / 2 - ringRadius - segmentHeight / 2,
                                                },
                                                isActive ? styles.segmentActive : styles.segmentInactive,
                                            ]}
                                        />
                                    </View>
                                );
                            })}

                            <View style={[styles.ringCenter, { width: ringCenterSize, height: ringCenterSize, borderRadius: ringCenterSize / 2 }]}>
                                <Text style={[styles.progressValue, { fontSize: rfs(40, 0.84, 1) }]}>{Math.round(progressPercent)}%</Text>
                                <Text style={styles.progressLabel}>filled</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.metricsRow, { gap: rs(12, 0.82, 1) }]}>
                        <View style={[styles.metricCard, { borderRadius: rs(22, 0.86, 1), padding: rs(18, 0.84, 1) }]}>
                            <Text style={styles.metricLabel}>Current</Text>
                            <Text style={[styles.metricValue, { fontSize: rfs(22, 0.86, 1) }]}>{formatCurrency(currentAmount)}</Text>
                        </View>
                        <View style={[styles.metricCardAccent, { borderRadius: rs(22, 0.86, 1), padding: rs(18, 0.84, 1) }]}>
                            <Text style={styles.metricLabelAccent}>Remaining</Text>
                            <Text style={[styles.metricValueAccent, { fontSize: rfs(22, 0.86, 1) }]}>{formatCurrency(remainingAmount)}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.editorCard, { borderRadius: rs(28, 0.86, 1), padding: rs(24, 0.84, 1) }]}>
                    <Text style={[styles.editorTitle, { fontSize: rfs(24, 0.86, 1) }]}>Set This Week's Target</Text>
                    <Text style={[styles.editorCopy, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.55), marginBottom: rv(20, 0.78, 1) }]}>The target repeats every week and progress resets automatically on Monday.</Text>

                    <Input
                        label="Weekly Goal"
                        value={goalInput}
                        onChangeText={setGoalInput}
                        keyboardType="decimal-pad"
                        placeholder="800"
                    />

                    <View style={styles.actionsRow}>
                        <Button
                            title="Clear"
                            variant="ghost"
                            onPress={() => setGoalInput('')}
                            style={styles.clearButton}
                        />
                        <Button
                            title="Save"
                            onPress={handleSaveGoal}
                            loading={isSavingGoal}
                            style={styles.saveButton}
                        />
                    </View>

                    <View style={styles.targetSummary}>
                        <Text style={styles.targetSummaryLabel}>Active target</Text>
                        <Text style={styles.targetSummaryValue}>
                            {targetAmount != null ? formatCurrency(targetAmount) : 'No goal set'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.quoteCard, { borderRadius: rs(28, 0.86, 1), padding: rs(24, 0.84, 1) }]}>
                    <Text style={[styles.quoteTitle, { fontSize: rfs(24, 0.86, 1) }]}>Motivation Quote</Text>
                    <Text style={[styles.quoteCopy, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.55), marginBottom: rv(20, 0.78, 1) }]}>Add a short line that keeps you focused this week.</Text>
                    <Input
                        label="Your Quote"
                        value={motivationQuoteInput}
                        onChangeText={setMotivationQuoteInput}
                        placeholder="Small steps every day build big results."
                        multiline
                        maxLength={220}
                        style={styles.quoteInput}
                    />
                    <View style={styles.quoteFooter}>
                        <Text style={styles.quoteCountText}>{motivationQuoteInput.length}/220</Text>
                    </View>
                    <Button
                        title="Save Quote"
                        onPress={handleSaveQuote}
                        loading={isSavingQuote}
                        style={styles.quoteSaveButton}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceBright,
    },
    screenHeader: {
        justifyContent: 'center',
    },
    screenTitle: {
        color: '#005232',
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: -1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 120,
        gap: 20,
    },
    heroCard: {
        backgroundColor: '#0d5a3d',
        borderRadius: 32,
        padding: 28,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.14,
        shadowRadius: 36,
        elevation: 10,
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    title: {
        color: colors.white,
        fontSize: 30,
        fontWeight: '800',
        lineHeight: 34,
        letterSpacing: -0.8,
    },
    ringWrap: {
        alignItems: 'center',
        marginVertical: 28,
    },
    ringBase: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentOrbit: {
        position: 'absolute',
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    segment: {
        width: 12,
        height: 34,
        borderRadius: 999,
        marginTop: RING_SIZE / 2 - RING_RADIUS - 17,
    },
    segmentActive: {
        backgroundColor: '#7cf0aa',
    },
    segmentInactive: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    ringCenter: {
        width: 154,
        height: 154,
        borderRadius: 77,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    progressValue: {
        color: colors.white,
        fontSize: 40,
        fontWeight: '800',
        letterSpacing: -1.2,
    },
    progressLabel: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.3,
        textTransform: 'uppercase',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 22,
        padding: 18,
    },
    metricCardAccent: {
        flex: 1,
        backgroundColor: '#ffefe4',
        borderRadius: 22,
        padding: 18,
    },
    metricLabel: {
        color: 'rgba(255,255,255,0.66)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    metricValue: {
        color: colors.white,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    metricLabelAccent: {
        color: 'rgba(65,33,0,0.60)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    metricValueAccent: {
        color: '#412100',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    editorCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 4,
    },
    editorTitle: {
        color: colors.onSurface,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.6,
        marginBottom: 8,
    },
    editorCopy: {
        color: colors.outline,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    clearButton: {
        flex: 0.9,
    },
    saveButton: {
        flex: 1.4,
    },
    targetSummary: {
        marginTop: 18,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceContainerHigh,
    },
    targetSummaryLabel: {
        color: colors.outline,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    targetSummaryValue: {
        color: colors.onSurface,
        fontSize: 22,
        fontWeight: '800',
    },
    quoteCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 4,
    },
    quoteTitle: {
        color: colors.onSurface,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.6,
        marginBottom: 8,
    },
    quoteCopy: {
        color: colors.outline,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },
    quoteInput: {
        minHeight: 84,
        textAlignVertical: 'top',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
        paddingVertical: 14,
    },
    quoteFooter: {
        marginTop: -10,
        alignItems: 'flex-end',
    },
    quoteCountText: {
        color: colors.outline,
        fontSize: 12,
        fontWeight: '600',
    },
    quoteSaveButton: {
        marginTop: 12,
    },
});
