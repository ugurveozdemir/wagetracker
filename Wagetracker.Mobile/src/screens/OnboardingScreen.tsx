import React, { useRef, useState } from 'react';
import {
    Image,
    ImageBackground,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useOnboardingStore } from '../stores';
import { colors, fontSizes, fontWeights, spacing, useResponsiveLayout } from '../theme';

const brandLogo = require('../../assets/logo.png');

const onboardingSlides = [
    {
        key: 'earnings',
        imageUri:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAhpVkLjxsEeQK0EzhKE7egEiHtKZAB_N4JvtyLRD-P-pJ9PZ6UoJvFAQjhOCy6V8fTZmHurS6GcMbMyz9Iwk-67x0TzOa91DjdE_lmY3-lrJanuwpQps1QlvpMh1zt3iNQ5MWGTnDXaEmVXCRpa4_Omj0zIJRYw2ORdcoENsLc4nfa7P2sOl83ckv0veA6EPHR8O5svne0wTyuW_fQPxy-_FtlWpQXNPxVvUtf4ABHIkWgbBiNtjIPBv4zN_2O5ELeGDA92AvcAdo9',
        titleStart: 'Track Your',
        titleAccent: 'Earnings',
        titleEnd: 'With Ease',
        description: 'Manage your hourly pay and earnings in one place, even if you work multiple jobs.',
        badgeLabel: 'CURRENT STATUS',
        badgeValue: '+ $1,250.00',
        badgeIcon: 'payments',
        imageMode: 'card',
        activeDotIndex: 0,
        cta: 'Next',
        showSkip: true,
        showBrand: true,
    },
    {
        key: 'goals',
        imageUri:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBOx7MbGlaOeQnpGHOjamdf6EznSi04LuJUoG_Yvzsvhdt9Gz9B8lWtrLArgGFiGH3n1dBsIECRKz-nWlhq6zesdkBQP4Sa1TVC9KMeKQDb1DeOLAC8BO1fP0ak-hSoscqObNcLzbJIY1o5dTf5X6X4aq_7gdECb3RuSvg5nNmotsSGz91t4nevYBD-p6QtXXt9iesCZsy1fC7MNEY53MMNE8TaDZuSTeVyQkQm-3zdT-1Vw43xJcZuMjjvFIqteM-JaJ5mYWKu02MH',
        titleStart: 'Get Ready',
        titleAccent: '',
        titleEnd: 'For Your Dream Trip',
        description: 'Set your goals, track your savings, and see how close you are to your next adventure.',
        badgeLabel: 'TARGET REACHED',
        badgeValue: '85%',
        badgeIcon: 'flight-takeoff',
        imageMode: 'wide',
        activeDotIndex: 1,
        cta: 'Next',
        showSkip: true,
        showBrand: false,
    },
    {
        key: 'expenses',
        imageUri:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAmC9BGTC4CfQ7u7e8gbkDrHMDxPFrDYpjqV9yc_vZjBk-LQOj-wOxZRToA5UOyyL6qrJM0VRXjcpRhTpcl_2ZZQ4X6wA8RGwh3qrQ7CSaPIJcL4imqNOy9vh25EYhPZ2PtW_jCP0VZfhgWyRHtItcUbaWzV0kaPFZyoL1o-PsBFmd_annoVyhA_rV3gr30CJelVrZfQyJDS25zlJ_7puSWyWUi9PHhMvr6r8mTpf0V_o8ev6hUUl4Vw2_s8MFkQ1FlQijwcz-LdXYf',
        titleStart: 'Manage Your',
        titleAccent: '',
        titleEnd: 'Expenses Smarter',
        description: 'Add receipts in seconds with AI-powered scanning and see exactly where your money goes.',
        badgeLabel: '',
        badgeValue: '$24.50',
        badgeIcon: 'receipt-long',
        imageMode: 'card',
        activeDotIndex: 2,
        cta: 'Get Started',
        showSkip: false,
        showBrand: false,
    },
] as const;

export const OnboardingScreen: React.FC = () => {
    const scrollRef = useRef<ScrollView>(null);
    const { top, bottom } = useSafeAreaInsets();
    const { width, height, horizontalPadding, isCompact, isSmallHeight, rs } = useResponsiveLayout();
    const { completeOnboarding } = useOnboardingStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);

    const lastIndex = onboardingSlides.length - 1;
    const isLastSlide = activeIndex === lastIndex;
    const topOffset = Math.max(top + spacing['2xl'], 56);
    const footerBottom = Math.max(bottom, Platform.OS === 'ios' ? spacing.lg : spacing.md);
    const visualHeight = Math.min(height * (isSmallHeight ? 0.3 : 0.34), isCompact ? 292 : 310);
    const verticalGap = isSmallHeight ? spacing.md : spacing.xl;

    const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(Math.min(Math.max(nextIndex, 0), lastIndex));
    };

    const finishOnboarding = async () => {
        if (isCompleting) {
            return;
        }

        setIsCompleting(true);
        await completeOnboarding();
    };

    const goToNextSlide = () => {
        const nextIndex = Math.min(activeIndex + 1, lastIndex);
        setActiveIndex(nextIndex);
        scrollRef.current?.scrollTo({ x: width * nextIndex, animated: true });
    };

    const handlePrimaryPress = () => {
        if (isLastSlide) {
            finishOnboarding().catch(console.error);
            return;
        }

        goToNextSlide();
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumEnd}
                scrollEventThrottle={16}
                style={styles.pager}
            >
                {onboardingSlides.map((slide) => (
                    <View
                        key={slide.key}
                        style={[
                            styles.slide,
                            {
                                width,
                                paddingHorizontal: horizontalPadding,
                                paddingTop: topOffset,
                                paddingBottom: footerBottom + spacing.md,
                            },
                        ]}
                    >
                        <View style={styles.content}>
                            <View style={[styles.brandSlot, { height: slide.showBrand ? rs(46) : 0 }]}>
                                {slide.showBrand ? (
                                    <View style={styles.brandRow}>
                                        <Image source={brandLogo} style={{ width: rs(42), height: rs(42) }} resizeMode="contain" />
                                        <Text style={[styles.brandText, { fontSize: isCompact ? 25 : 29 }]}>Chickaree</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View
                                style={[
                                    styles.visualWrap,
                                    {
                                        height: visualHeight,
                                        marginTop: slide.showBrand ? spacing.xl : 0,
                                    },
                                ]}
                            >
                                <ImageBackground
                                    source={{ uri: slide.imageUri }}
                                    resizeMode="cover"
                                    style={styles.heroImage}
                                    imageStyle={[
                                        styles.heroImageRadius,
                                        slide.imageMode === 'wide' ? styles.wideImageRadius : null,
                                    ]}
                                >
                                    <View style={[
                                        styles.glassBadge,
                                        slide.key === 'earnings' ? styles.earningBadge : null,
                                        slide.key === 'goals' ? styles.goalBadge : null,
                                        slide.key === 'expenses' ? styles.expenseBadge : null,
                                    ]}>
                                        <View style={styles.badgeIcon}>
                                            <MaterialIcons name={slide.badgeIcon} size={18} color={colors.white} />
                                        </View>
                                        <View style={styles.badgeCopy}>
                                            {slide.badgeLabel ? (
                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.badgeLabel,
                                                        slide.key === 'earnings' ? styles.earningBadgeLabel : null,
                                                    ]}
                                                >
                                                    {slide.badgeLabel}
                                                </Text>
                                            ) : null}
                                            <Text
                                                numberOfLines={1}
                                                style={[
                                                    styles.badgeValue,
                                                    slide.key === 'earnings' ? styles.earningBadgeValue : null,
                                                ]}
                                            >
                                                {slide.badgeValue}
                                            </Text>
                                        </View>
                                    </View>

                                    {slide.key === 'expenses' ? (
                                        <View style={styles.aiBadge}>
                                            <Text style={styles.aiBadgeText}>AI Powered</Text>
                                        </View>
                                    ) : null}
                                </ImageBackground>
                            </View>

                            <View style={[styles.copyBlock, { marginTop: verticalGap }]}>
                                <Text style={[styles.title, { fontSize: isCompact ? 32 : 36, lineHeight: isCompact ? 39 : 43 }]}>
                                    {slide.titleStart}
                                    {slide.titleAccent ? (
                                        <>
                                            {'\n'}
                                            <Text style={styles.titleAccent}>{slide.titleAccent}</Text>
                                            {' '}
                                        </>
                                    ) : (
                                        '\n'
                                    )}
                                    {slide.titleEnd}
                                </Text>

                                <Text
                                    style={[
                                        styles.description,
                                        {
                                            fontSize:
                                                slide.key === 'earnings'
                                                    ? (isCompact ? 17 : 18)
                                                    : (isCompact ? 19 : 21),
                                        },
                                        slide.key === 'earnings' ? styles.earningDescription : null,
                                    ]}
                                >
                                    {slide.description}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View
                style={[
                    styles.fixedFooter,
                    {
                        left: horizontalPadding,
                        right: horizontalPadding,
                        bottom: footerBottom,
                    },
                ]}
            >
                <View style={styles.dotsRow}>
                    {onboardingSlides.map((slide, index) => (
                        <View
                            key={slide.key}
                            style={[styles.dot, activeIndex === index && styles.dotActive]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={isLastSlide ? 'Get Started' : 'Next'}
                    activeOpacity={0.88}
                    disabled={isCompleting}
                    onPress={handlePrimaryPress}
                    style={[styles.primaryButton, isCompleting && styles.disabledButton]}
                >
                    <Text style={styles.primaryButtonText}>{isCompleting ? 'Starting...' : onboardingSlides[activeIndex].cta}</Text>
                    {!isLastSlide ? <MaterialIcons name="arrow-forward" size={28} color={colors.white} /> : null}
                </TouchableOpacity>

                {onboardingSlides[activeIndex].showSkip ? (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Skip for now"
                        activeOpacity={0.75}
                        disabled={isCompleting}
                        onPress={() => finishOnboarding().catch(console.error)}
                        style={styles.skipButton}
                    >
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.skipPlaceholder} />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    pager: {
        flex: 1,
    },
    slide: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    content: {
        flex: 1,
    },
    brandSlot: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.01,
    },
    brandText: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
    },
    visualWrap: {
        width: '100%',
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.08,
        shadowRadius: 34,
        elevation: 8,
    },
    heroImage: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    heroImageRadius: {
        borderRadius: 42,
    },
    wideImageRadius: {
        borderRadius: 30,
    },
    glassBadge: {
        position: 'absolute',
        minWidth: 178,
        minHeight: 66,
        borderRadius: 34,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(241, 245, 239, 0.82)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    earningBadge: {
        right: spacing.xl,
        bottom: spacing.xl,
        minWidth: 190,
        gap: spacing.sm,
    },
    goalBadge: {
        top: spacing.lg,
        right: spacing.lg,
    },
    expenseBadge: {
        left: spacing['3xl'],
        right: spacing['3xl'],
        top: '38%',
        minWidth: 0,
        justifyContent: 'space-between',
    },
    badgeIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeCopy: {
        flex: 1,
        minWidth: 0,
    },
    badgeLabel: {
        color: colors.primary,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        letterSpacing: 2,
    },
    badgeValue: {
        color: colors.primary,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.extrabold,
        letterSpacing: 1.4,
        marginTop: spacing.xs,
    },
    earningBadgeLabel: {
        fontSize: 9,
        letterSpacing: 1.4,
    },
    earningBadgeValue: {
        fontSize: fontSizes.lg,
        letterSpacing: 0.4,
        marginTop: 2,
    },
    aiBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        minWidth: 150,
        minHeight: 58,
        borderRadius: 29,
        backgroundColor: '#ff8a00',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    aiBadgeText: {
        color: colors.white,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.extrabold,
    },
    copyBlock: {
        alignItems: 'center',
    },
    title: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    titleAccent: {
        color: '#ff8a00',
        fontWeight: fontWeights.extrabold,
    },
    description: {
        color: colors.onSurfaceVariant,
        lineHeight: 30,
        fontWeight: fontWeights.medium,
        textAlign: 'center',
        maxWidth: 342,
    },
    earningDescription: {
        lineHeight: 28,
        marginTop: -spacing.sm,
    },
    fixedFooter: {
        position: 'absolute',
        alignItems: 'center',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        height: 18,
        marginBottom: spacing['3xl'],
        transform: [{ translateY: 18 }],
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.surfaceContainerHighest,
    },
    dotActive: {
        width: 36,
        backgroundColor: '#ff8a00',
    },
    primaryButton: {
        width: '100%',
        minHeight: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.extrabold,
    },
    skipButton: {
        minHeight: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    skipText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.semibold,
    },
    skipPlaceholder: {
        height: 54 + spacing.xl,
    },
});
