import React, { useRef, useState } from 'react';
import {
    Image,
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
import { useOnboardingStore } from '../stores';
import { colors, fontWeights, spacing, useResponsiveLayout } from '../theme';

const brandLogo = require('../../assets/logo.png');

const onboardingSlides = [
    {
        key: 'overview',
        image: require('../assets/onboarding/overview.png'),
        title: 'Track work,\nincome & spending',
        description: 'Add jobs, log shifts, set weekly goals,\nand keep your expenses organized\nin one simple app.',
        cta: 'Continue',
        showSkip: true,
        assetWidth: 1782,
        assetHeight: 1930,
    },
    {
        key: 'add-jobs',
        image: require('../assets/onboarding/add-jobs.png'),
        title: 'Add jobs in seconds',
        description: 'Create each job with its hourly rate\nand keep multiple jobs organized\nin one place.',
        cta: 'Continue',
        showSkip: true,
        assetWidth: 1665,
        assetHeight: 1930,
    },
    {
        key: 'log-shifts',
        image: require('../assets/onboarding/log-shifts.png'),
        title: 'Log every shift\neasily',
        description: 'Enter hours, tips, and overtime after\neach shift. Totals and weekly progress\nupdate automatically.',
        cta: 'Continue',
        showSkip: true,
        assetWidth: 1882,
        assetHeight: 2092,
    },
    {
        key: 'scan-receipts',
        image: require('../assets/onboarding/scan-receipts.png'),
        title: 'Scan receipts with AI',
        description: 'Snap or upload a receipt and let AI\nfill in the amount, merchant, and\ncategory automatically.',
        cta: 'Get Started',
        showSkip: false,
        assetWidth: 1635,
        assetHeight: 2212,
    },
] as const;

export const OnboardingScreen: React.FC = () => {
    const scrollRef = useRef<ScrollView>(null);
    const { top, bottom } = useSafeAreaInsets();
    const { width, height, horizontalPadding, isCompact, isSmallHeight, isShortHeight, isVeryShortHeight, rs, rv, rfs, metrics } =
        useResponsiveLayout();
    const { completeOnboarding } = useOnboardingStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);

    const lastIndex = onboardingSlides.length - 1;
    const isLastSlide = activeIndex === lastIndex;
    const topInset = Math.max(top, Platform.OS === 'ios' ? spacing.md : spacing.sm);
    const bottomInset = Math.max(bottom, Platform.OS === 'ios' ? spacing.md : spacing.sm);
    const headerHeight = rv(isVeryShortHeight ? 74 : isShortHeight ? 82 : 92, 0.78, 1);
    const isSeHeight = height >= 620 && height < 700;
    const maxVisualHeight = Math.round(height * (isSeHeight ? 0.48 : isVeryShortHeight ? 0.41 : isSmallHeight ? 0.43 : 0.47));
    const maxImageWidth = Math.round(width * (isSeHeight ? 0.98 : isCompact ? 0.9 : 0.94));
    const titleSize = rfs(isCompact ? 30 : 34, 0.78, 1);
    const titleLineHeight = Math.round(titleSize * 1.08);
    const descriptionSize = rfs(isCompact ? 15 : 17, 0.84, 1);
    const descriptionLineHeight = Math.round(descriptionSize * 1.38);
    const copyGap = rv(isSmallHeight ? 8 : 12, 0.7, 1);
    const buttonHeight = Math.max(metrics.touchTarget, Math.round(rv(isSmallHeight ? 56 : 60, 0.82, 1)));

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
            <StatusBar barStyle="dark-content" backgroundColor={styles.container.backgroundColor} />

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
                {onboardingSlides.map((slide, slideIndex) => {
                    const imageRatio = slide.assetHeight / slide.assetWidth;
                    const slideImageWidth = Math.round(Math.min(maxImageWidth, maxVisualHeight / imageRatio));
                    const slideImageHeight = Math.round(slideImageWidth * imageRatio);

                    return (
                        <View
                            key={slide.key}
                            style={[
                                styles.slide,
                                {
                                    width,
                                    paddingTop: topInset,
                                    paddingBottom: bottomInset,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.header,
                                    {
                                        height: headerHeight,
                                        paddingHorizontal: horizontalPadding,
                                    },
                                ]}
                            >
                                <View style={styles.brandRow}>
                                    <Image source={brandLogo} style={{ width: rs(28), height: rs(28) }} resizeMode="contain" />
                                    <Text style={[styles.brandText, { fontSize: rfs(isCompact ? 23 : 26, 0.84, 1) }]}>Chickaree</Text>
                                </View>

                                {slide.showSkip ? (
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Skip"
                                        activeOpacity={0.7}
                                        disabled={isCompleting}
                                        onPress={() => finishOnboarding().catch(console.error)}
                                        style={styles.skipButton}
                                    >
                                        <Text style={[styles.skipText, { fontSize: rfs(16, 0.86, 1) }]}>Skip</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            <View style={[styles.visualStage, { height: slideImageHeight }]}>
                                <Image
                                    accessibilityIgnoresInvertColors
                                    source={slide.image}
                                    resizeMode="contain"
                                    style={[
                                        styles.heroImage,
                                        {
                                            width: slideImageWidth,
                                            height: slideImageHeight,
                                        },
                                    ]}
                                />
                            </View>

                            <View style={[styles.copyBlock, { paddingHorizontal: horizontalPadding }]}>
                                <Text
                                    maxFontSizeMultiplier={1.02}
                                    style={[
                                        styles.title,
                                        {
                                            fontSize: titleSize,
                                            lineHeight: titleLineHeight,
                                            marginBottom: copyGap,
                                        },
                                    ]}
                                >
                                    {slide.title}
                                </Text>

                                <Text
                                    maxFontSizeMultiplier={1.04}
                                    style={[
                                        styles.description,
                                        {
                                            fontSize: descriptionSize,
                                            lineHeight: descriptionLineHeight,
                                        },
                                    ]}
                                >
                                    {slide.description}
                                </Text>
                            </View>

                            <View style={[styles.actions, { paddingHorizontal: horizontalPadding }]}>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel={slide.cta}
                                    activeOpacity={0.9}
                                    disabled={isCompleting}
                                    onPress={activeIndex === slideIndex ? handlePrimaryPress : undefined}
                                    style={[
                                        styles.primaryButton,
                                        {
                                            minHeight: buttonHeight,
                                            borderRadius: buttonHeight / 2,
                                        },
                                        isCompleting && styles.disabledButton,
                                    ]}
                                >
                                    <Text style={[styles.primaryButtonText, { fontSize: rfs(18, 0.86, 1) }]}>
                                        {isCompleting && activeIndex === slideIndex ? 'Starting...' : slide.cta}
                                    </Text>
                                </TouchableOpacity>

                                <View style={[styles.dotsRow, { marginTop: rv(isSmallHeight ? 14 : 18, 0.7, 1) }]}>
                                    {onboardingSlides.map((dotSlide, index) => (
                                        <View key={dotSlide.key} style={[styles.dot, activeIndex === index && styles.dotActive]} />
                                    ))}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
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
    visualStage: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroImage: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
        letterSpacing: 0,
    },
    skipButton: {
        minHeight: 44,
        minWidth: 64,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    skipText: {
        color: colors.slate500,
        fontWeight: fontWeights.medium,
        letterSpacing: 0,
    },
    fixedFooter: {
        alignItems: 'center',
    },
    copyBlock: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 142,
    },
    title: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
        textAlign: 'center',
        letterSpacing: 0,
    },
    description: {
        color: colors.slate400,
        fontWeight: fontWeights.medium,
        textAlign: 'center',
        letterSpacing: 0,
    },
    actions: {
        alignItems: 'center',
    },
    primaryButton: {
        width: '86%',
        maxWidth: 520,
        backgroundColor: '#ff8600',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ff8600',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: colors.white,
        fontWeight: fontWeights.extrabold,
        letterSpacing: 0,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
        minHeight: 18,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.surfaceContainerHighest,
    },
    dotActive: {
        backgroundColor: colors.primary,
    },
});
