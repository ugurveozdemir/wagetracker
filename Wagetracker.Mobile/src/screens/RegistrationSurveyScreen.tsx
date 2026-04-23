import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../stores';
import {
    SubmitRegistrationSurveyRequest,
    SurveyPlannedJobCount,
    SurveyPrimaryGoal,
    SurveySpendingHabit,
} from '../types';
import { colors, fontSizes, fontWeights, spacing, useResponsiveLayout } from '../theme';

type SurveyStep = 0 | 1 | 2;
type SurveyAnswer = SurveyPrimaryGoal | SurveyPlannedJobCount | SurveySpendingHabit;

interface SurveyOption<T extends SurveyAnswer> {
    value: T;
    title: string;
    description: string;
    icon: string;
    tone: 'primary' | 'secondary' | 'tertiary' | 'neutral';
}

const primaryGoalOptions: SurveyOption<SurveyPrimaryGoal>[] = [
    {
        value: 'travel_savings',
        title: 'Save for Travel',
        description: 'Plan your budget for the route you want to explore at the end of summer.',
        icon: 'explore',
        tone: 'tertiary',
    },
    {
        value: 'new_experiences',
        title: 'Enjoy New Experiences',
        description: 'Make room for concerts, festivals, and social plans throughout the summer.',
        icon: 'celebration',
        tone: 'primary',
    },
    {
        value: 'education_costs',
        title: 'Cover Education Costs',
        description: 'Manage your savings wisely for the next school term.',
        icon: 'school',
        tone: 'secondary',
    },
    {
        value: 'save_money',
        title: 'Just Save Money',
        description: 'Focus on building a stronger financial foundation for the future.',
        icon: 'account-balance-wallet',
        tone: 'neutral',
    },
];

const plannedJobOptions: SurveyOption<SurveyPlannedJobCount>[] = [
    {
        value: 'one_job',
        title: 'Just 1 Job',
        description: 'Focus on one employer and enjoy your free time.',
        icon: 'looks-one',
        tone: 'neutral',
    },
    {
        value: 'two_jobs',
        title: '2 Jobs (Main + Side Job)',
        description: 'A popular choice. Extra shifts for more income.',
        icon: 'looks-two',
        tone: 'primary',
    },
    {
        value: 'three_or_more',
        title: '3 or More',
        description: 'A busy schedule for maximum savings.',
        icon: 'filter-3',
        tone: 'secondary',
    },
    {
        value: 'undecided',
        title: 'Not Sure Yet',
        description: 'Decide after you compare your options.',
        icon: 'question-mark',
        tone: 'neutral',
    },
];

const spendingHabitOptions: SurveyOption<SurveySpendingHabit>[] = [
    {
        value: 'frugal',
        title: 'Frugal',
        description: 'Only the essentials. I avoid unnecessary spending.',
        icon: 'potted-plant',
        tone: 'primary',
    },
    {
        value: 'balanced',
        title: 'Balanced',
        description: 'Savings and enjoyment. I save without missing out.',
        icon: 'balance',
        tone: 'primary',
    },
    {
        value: 'experience_focused',
        title: 'Experience Focused',
        description: 'I spend on travel, plans, and moments I care about.',
        icon: 'flight-takeoff',
        tone: 'tertiary',
    },
    {
        value: 'no_tracking',
        title: 'No Expense Tracking',
        description: 'I do not track spending. I go with the flow.',
        icon: 'visibility-off',
        tone: 'neutral',
    },
];

const stepMeta = [
    {
        label: 'Step 1 of 3',
        progress: '33% Complete',
        eyebrow: 'Set Your Goal',
        title: 'What Is Your Main Goal This Summer?',
        subtitle: 'Choose your biggest motivation so future updates can better fit your plans.',
    },
    {
        label: 'Step 2 of 3',
        progress: '66% Complete',
        eyebrow: 'Planning Stage',
        title: 'How Many Different Jobs Do You Plan to Work This Summer?',
        subtitle: 'Help us better understand your income goals for your Work and Travel season.',
    },
    {
        label: 'Step 3 of 3',
        progress: 'Almost Done',
        eyebrow: 'Spending Habits',
        title: 'What Are Your Spending Habits Like?',
        subtitle: 'Help us shape future updates around your financial goals.',
    },
] as const;

export const RegistrationSurveyScreen: React.FC = () => {
    const { submitRegistrationSurvey, isSubmittingSurvey } = useAuthStore();
    const { horizontalPadding, isCompact, isShortHeight, rfs, rs, rv } = useResponsiveLayout();
    const [step, setStep] = useState<SurveyStep>(0);
    const [primaryGoal, setPrimaryGoal] = useState<SurveyPrimaryGoal | null>(null);
    const [plannedJobCount, setPlannedJobCount] = useState<SurveyPlannedJobCount | null>(null);
    const [spendingHabit, setSpendingHabit] = useState<SurveySpendingHabit | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const activeOptions = useMemo(() => {
        if (step === 0) return primaryGoalOptions;
        if (step === 1) return plannedJobOptions;
        return spendingHabitOptions;
    }, [step]);

    const activeValue = step === 0 ? primaryGoal : step === 1 ? plannedJobCount : spendingHabit;
    const meta = stepMeta[step];
    const progressPercent = `${Math.round(((step + 1) / 3) * 100)}%` as const;

    const submitFinalSurvey = async (selectedSpendingHabit: SurveySpendingHabit) => {
        if (!primaryGoal || !plannedJobCount || isFinalizing || isSubmittingSurvey) {
            return;
        }

        const payload: SubmitRegistrationSurveyRequest = {
            primaryGoal,
            plannedJobCount,
            spendingHabit: selectedSpendingHabit,
        };

        try {
            setIsFinalizing(true);
            await submitRegistrationSurvey(payload);
            Toast.show({
                type: 'success',
                text1: 'Preferences Saved',
                text2: 'Your workspace is ready.',
                visibilityTime: 2000,
            });
        } catch (error) {
            setIsFinalizing(false);
            Toast.show({
                type: 'error',
                text1: 'Survey Failed',
                text2: error instanceof Error ? error.message : 'Please try again.',
                visibilityTime: 2800,
            });
        }
    };

    const handleSelect = (value: SurveyAnswer) => {
        if (isFinalizing || isSubmittingSurvey) {
            return;
        }

        if (step === 0) {
            setPrimaryGoal(value as SurveyPrimaryGoal);
            setStep(1);
            return;
        }

        if (step === 1) {
            setPlannedJobCount(value as SurveyPlannedJobCount);
            setStep(2);
            return;
        }

        const selectedSpendingHabit = value as SurveySpendingHabit;
        setSpendingHabit(selectedSpendingHabit);
        void submitFinalSurvey(selectedSpendingHabit);
    };

    const handleBack = () => {
        if (step > 0) {
            setStep((current) => (current - 1) as SurveyStep);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: rv(8, 0.7, 1) }]}>
                <TouchableOpacity
                    style={[styles.headerButton, { opacity: step === 0 ? 0.35 : 1 }]}
                    activeOpacity={0.8}
                    onPress={handleBack}
                    disabled={step === 0 || isSubmittingSurvey || isFinalizing}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepLabel}>{meta.label}</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: rv(isShortHeight ? 16 : 24, 0.7, 1),
                    paddingBottom: rv(40, 0.72, 1),
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.progressBlock, { marginBottom: rv(isShortHeight ? 20 : 32, 0.7, 1) }]}>
                    <View style={styles.progressMeta}>
                        <Text style={[styles.progressTitle, { fontSize: rfs(20, 0.86, 1) }]}>{meta.eyebrow}</Text>
                        <Text style={[styles.progressText, { fontSize: rfs(12, 0.9, 1) }]}>{meta.progress}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: progressPercent }]} />
                    </View>
                </View>

                <View style={[styles.questionBlock, { marginBottom: rv(isShortHeight ? 18 : 24, 0.72, 1) }]}>
                    <Text
                        style={[
                            styles.title,
                            {
                                fontSize: rfs(isCompact ? 34 : 38, 0.8, 1),
                                lineHeight: Math.round(rfs(isCompact ? 34 : 38, 0.8, 1) * 1.14),
                            },
                        ]}
                    >
                        {meta.title}
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            {
                                fontSize: rfs(18, 0.88, 1),
                                lineHeight: Math.round(rfs(18, 0.88, 1) * 1.42),
                            },
                        ]}
                    >
                        {meta.subtitle}
                    </Text>
                </View>

                <View style={[styles.optionsGrid, { gap: rv(12, 0.74, 1) }]}>
                    {activeOptions.map((option) => {
                        const isSelected = activeValue === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionCard,
                                    {
                                        minHeight: rv(isShortHeight ? 96 : 114, 0.84, 1),
                                        padding: rs(isShortHeight ? 14 : 16, 0.84, 1),
                                        borderRadius: rs(24, 0.86, 1),
                                        gap: rs(12, 0.82, 1),
                                    },
                                    isSelected && styles.optionCardSelected,
                                ]}
                                activeOpacity={0.86}
                                onPress={() => handleSelect(option.value)}
                                disabled={isSubmittingSurvey || isFinalizing}
                            >
                                <View
                                    style={[
                                        styles.optionIcon,
                                        {
                                            width: rs(54, 0.82, 1),
                                            height: rs(54, 0.82, 1),
                                            borderRadius: rs(18, 0.82, 1),
                                        },
                                        styles[`${option.tone}Icon`],
                                    ]}
                                >
                                    <MaterialIcons
                                        name={option.icon}
                                        size={Math.round(rs(26, 0.84, 1))}
                                        color={option.tone === 'secondary' ? '#5a2400' : colors.primary}
                                    />
                                </View>
                                <View style={styles.optionCopy}>
                                    <Text style={[styles.optionTitle, { fontSize: rfs(20, 0.86, 1) }]}>{option.title}</Text>
                                    <Text
                                        style={[
                                            styles.optionDescription,
                                            {
                                                fontSize: rfs(14, 0.9, 1),
                                                lineHeight: Math.round(rfs(14, 0.9, 1) * 1.42),
                                            },
                                        ]}
                                    >
                                        {option.description}
                                    </Text>
                                </View>
                                {isSelected ? (
                                    <MaterialIcons name="check-circle" size={26} color={colors.primary} />
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View
                    style={[
                        styles.tipCard,
                        {
                            marginTop: rv(isShortHeight ? 20 : 32, 0.7, 1),
                            padding: rs(isShortHeight ? 16 : 20, 0.82, 1),
                            borderRadius: rs(28, 0.86, 1),
                            gap: rs(16, 0.82, 1),
                        },
                    ]}
                >
                    <MaterialIcons name={step === 2 ? 'savings' : 'lightbulb'} size={Math.round(rs(30, 0.82, 1))} color={colors.primarySoft} />
                    <View style={styles.tipCopy}>
                        <Text style={[styles.tipTitle, { fontSize: rfs(20, 0.86, 1) }]}>{step === 2 ? 'Last step' : 'Did you know?'}</Text>
                        <Text
                            style={[
                                styles.tipText,
                                {
                                    fontSize: rfs(14, 0.9, 1),
                                    lineHeight: Math.round(rfs(14, 0.9, 1) * 1.45),
                                },
                            ]}
                        >
                            {step === 2
                                ? 'We only save these answers to shape future product updates more effectively.'
                                : 'Most Work and Travel students adjust their plan again around mid-summer.'}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLabel: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
    },
    scroll: {
        flex: 1,
    },
    progressBlock: {
        marginBottom: spacing['3xl'],
    },
    progressMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    progressTitle: {
        flex: 1,
        color: colors.primary,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
    },
    progressText: {
        color: colors.outline,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    progressTrack: {
        width: '100%',
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.surfaceContainerHigh,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    questionBlock: {
        marginBottom: spacing['2xl'],
    },
    title: {
        color: colors.onSurface,
        lineHeight: 44,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.md,
    },
    subtitle: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.lg,
        lineHeight: 25,
        fontWeight: fontWeights.medium,
    },
    optionsGrid: {
        gap: spacing.md,
    },
    optionCard: {
        minHeight: 114,
        borderRadius: 24,
        backgroundColor: colors.surfaceContainerLowest,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.03)',
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    optionCardSelected: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 5,
    },
    optionIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryIcon: {
        backgroundColor: colors.primarySoft,
    },
    secondaryIcon: {
        backgroundColor: colors.secondarySoft,
    },
    tertiaryIcon: {
        backgroundColor: '#d9e2ff',
    },
    neutralIcon: {
        backgroundColor: colors.surfaceContainerHigh,
    },
    optionCopy: {
        flex: 1,
    },
    optionTitle: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    optionDescription: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 20,
        fontWeight: fontWeights.medium,
    },
    tipCard: {
        marginTop: spacing['3xl'],
        borderRadius: 28,
        padding: spacing.xl,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        gap: spacing.lg,
        alignItems: 'flex-start',
    },
    tipCopy: {
        flex: 1,
    },
    tipTitle: {
        color: colors.white,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.xs,
    },
    tipText: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: fontSizes.base,
        lineHeight: 22,
        fontWeight: fontWeights.medium,
    },
});
