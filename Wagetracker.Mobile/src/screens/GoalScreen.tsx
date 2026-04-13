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
import { colors } from '../theme';

const RING_SEGMENTS = 40;
const RING_SIZE = 240;
const RING_RADIUS = 92;

const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const GoalScreen: React.FC = () => {
    const { summary, fetchDashboard, isLoading, hasLoadedDashboard } = useJobsStore();
    const [goalInput, setGoalInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const targetAmount = summary?.weeklyGoal?.targetAmount ?? null;
    const currentAmount = summary?.weeklyGoal?.currentAmount ?? 0;
    const progressPercent = Math.max(0, Math.min(summary?.weeklyGoal?.progressPercent ?? 0, 100));
    const remainingAmount = summary?.weeklyGoal?.remainingAmount ?? 0;
    const activeSegments = Math.round((progressPercent / 100) * RING_SEGMENTS);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard({ silent: hasLoadedDashboard });
        }, [fetchDashboard, hasLoadedDashboard])
    );

    useEffect(() => {
        setGoalInput(targetAmount != null ? String(targetAmount) : '');
    }, [targetAmount]);

    const ringSegments = useMemo(
        () => Array.from({ length: RING_SEGMENTS }, (_, index) => index),
        []
    );

    const handleSave = async () => {
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
            setIsSaving(true);
            await profileApi.updateWeeklyGoal({ targetAmount: parsedGoal });
            await fetchDashboard();
            Toast.show({
                type: 'success',
                text1: parsedGoal == null ? 'Goal Cleared' : 'Goal Updated',
                text2: parsedGoal == null ? 'This week no longer has a target.' : 'Your weekly target was saved.',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Save Failed',
                text2: error instanceof Error ? error.message : 'Could not update your weekly goal.',
            });
        } finally {
            setIsSaving(false);
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
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.screenHeader}>
                    <Text style={styles.screenTitle}>My Goal</Text>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>Weekly Goal</Text>
                    <Text style={styles.title}>Progress resets automatically every Monday.</Text>

                    <View style={styles.ringWrap}>
                        <View style={styles.ringBase}>
                            {ringSegments.map((segment) => {
                                const rotation = `${(360 / RING_SEGMENTS) * segment}deg`;
                                const isActive = segment < activeSegments;

                                return (
                                    <View
                                        key={segment}
                                        style={[
                                            styles.segmentOrbit,
                                            { transform: [{ rotate: rotation }] },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.segment,
                                                isActive ? styles.segmentActive : styles.segmentInactive,
                                            ]}
                                        />
                                    </View>
                                );
                            })}

                            <View style={styles.ringCenter}>
                                <Text style={styles.progressValue}>{Math.round(progressPercent)}%</Text>
                                <Text style={styles.progressLabel}>filled</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Current</Text>
                            <Text style={styles.metricValue}>{formatCurrency(currentAmount)}</Text>
                        </View>
                        <View style={styles.metricCardAccent}>
                            <Text style={styles.metricLabelAccent}>Remaining</Text>
                            <Text style={styles.metricValueAccent}>{formatCurrency(remainingAmount)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.editorCard}>
                    <Text style={styles.editorTitle}>Set This Week's Target</Text>
                    <Text style={styles.editorCopy}>The target repeats every week and progress resets automatically on Monday.</Text>

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
                            onPress={handleSave}
                            loading={isSaving}
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
        color: '#006D44',
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
});
