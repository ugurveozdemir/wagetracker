import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;
const MIN_TOUCH_TARGET = 44;

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export type WidthClass = 'narrow' | 'regular' | 'wide';
export type HeightClass = 'short' | 'medium' | 'tall';
export type Density = 'compact' | 'comfortable' | 'spacious';

export const useResponsiveLayout = () => {
    const { width, height } = useWindowDimensions();
    const rawWidthScale = width / BASE_WIDTH;
    const rawHeightScale = height / BASE_HEIGHT;
    const widthScale = clamp(rawWidthScale, 0.88, 1.08);
    const heightScale = clamp(rawHeightScale, 0.78, 1.06);
    const isShortHeight = height < 740;
    const isVeryShortHeight = height < 700;
    const widthClass: WidthClass = width < 380 ? 'narrow' : width < 430 ? 'regular' : 'wide';
    const heightClass: HeightClass = height < 700 ? 'short' : height < 820 ? 'medium' : 'tall';
    const density: Density =
        widthClass === 'narrow' || heightClass === 'short'
            ? 'compact'
            : heightClass === 'tall'
              ? 'spacious'
              : 'comfortable';
    const scale = clamp((widthScale * 0.72) + (heightScale * 0.28), 0.86, 1.06);
    const verticalScale = clamp(heightScale, isVeryShortHeight ? 0.82 : 0.86, 1.04);
    const fontScale = clamp(widthScale * (isVeryShortHeight ? 0.94 : isShortHeight ? 0.97 : 1), 0.88, 1.03);
    const isCompact = width < 380;
    const isSmallHeight = height < 780;

    const rs = (value: number, minFactor = 0.86, maxFactor = 1.06) => {
        return clamp(value * scale, value * minFactor, value * maxFactor);
    };

    const rv = (value: number, minFactor = 0.78, maxFactor = 1.04) => {
        return clamp(value * verticalScale, value * minFactor, value * maxFactor);
    };

    const rfs = (value: number, minFactor = 0.88, maxFactor = 1.03) => {
        return Math.round(clamp(value * fontScale, value * minFactor, value * maxFactor));
    };

    const lineHeight = (fontSize: number, ratio = 1.16) => Math.round(fontSize * ratio);

    const horizontalPadding = widthClass === 'narrow' ? 18 : widthClass === 'wide' ? 28 : 24;
    const buttonHeight = Math.max(MIN_TOUCH_TARGET, Math.round(rv(68, 0.86, 1)));
    const primaryButtonHeight = Math.max(MIN_TOUCH_TARGET, Math.round(rv(72, 0.82, 1)));
    const inputHeight = Math.max(54, Math.round(rv(72, 0.78, 1)));
    const compactInputHeight = Math.max(50, Math.round(rv(64, 0.82, 1)));
    const cardPadding = Math.round(rs(24, 0.84, 1.04));
    const screenTopPadding = Math.round(rv(24, 0.68, 1.04));

    const type = {
        heroTitle: {
            fontSize: rfs(48, 0.82, 1.02),
            lineHeight: lineHeight(rfs(48, 0.82, 1.02), 1.08),
        },
        screenTitle: {
            fontSize: rfs(38, 0.82, 1.02),
            lineHeight: lineHeight(rfs(38, 0.82, 1.02), 1.12),
        },
        sectionTitle: {
            fontSize: rfs(28, 0.86, 1.02),
            lineHeight: lineHeight(rfs(28, 0.86, 1.02), 1.14),
        },
        cardTitle: {
            fontSize: rfs(24, 0.86, 1.02),
            lineHeight: lineHeight(rfs(24, 0.86, 1.02), 1.18),
        },
        body: {
            fontSize: rfs(16, 0.9, 1.02),
            lineHeight: lineHeight(rfs(16, 0.9, 1.02), 1.45),
        },
        bodyLarge: {
            fontSize: rfs(18, 0.88, 1.02),
            lineHeight: lineHeight(rfs(18, 0.88, 1.02), 1.42),
        },
        label: {
            fontSize: rfs(12, 0.9, 1.02),
            lineHeight: lineHeight(rfs(12, 0.9, 1.02), 1.25),
        },
    };

    const space = {
        xs: Math.round(rv(4)),
        sm: Math.round(rv(8)),
        md: Math.round(rv(12)),
        lg: Math.round(rv(16)),
        xl: Math.round(rv(20)),
        '2xl': Math.round(rv(24)),
        '3xl': Math.round(rv(32)),
        '4xl': Math.round(rv(40)),
        '5xl': Math.round(rv(48)),
        screen: horizontalPadding,
        section: Math.round(rv(28, 0.7, 1.04)),
        stack: Math.round(rv(16, 0.75, 1.04)),
    };

    const metrics = {
        touchTarget: MIN_TOUCH_TARGET,
        buttonHeight,
        primaryButtonHeight,
        inputHeight,
        compactInputHeight,
        cardPadding,
        screenTopPadding,
        headerHeight: Math.max(MIN_TOUCH_TARGET, Math.round(rv(52, 0.86, 1.02))),
        tabBarIconSize: Math.round(rs(22, 0.86, 1)),
        tabBarLabelSize: rfs(11, 0.86, 1),
        modalTopPadding: Math.round(rv(18, 0.72, 1.04)),
        modalBottomPadding: Math.round(rv(36, 0.78, 1.04)),
    };

    return {
        width,
        height,
        scale,
        verticalScale,
        fontScale,
        widthClass,
        heightClass,
        density,
        isCompact,
        isSmallHeight,
        isShortHeight,
        isVeryShortHeight,
        horizontalPadding,
        touchTarget: MIN_TOUCH_TARGET,
        panelRadius: rs(32),
        cardRadius: rs(24),
        heroRadius: rs(40),
        fabSize: rs(64),
        rs,
        rv,
        rfs,
        space,
        type,
        metrics,
    };
};
