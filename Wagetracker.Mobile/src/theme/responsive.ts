import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 393;

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export const useResponsiveLayout = () => {
    const { width, height } = useWindowDimensions();
    const scale = clamp(width / BASE_WIDTH, 0.84, 1);
    const isCompact = width < 380;
    const isSmallHeight = height < 780;

    const rs = (value: number, minFactor = 0.86) => {
        return clamp(value * scale, value * minFactor, value);
    };

    return {
        width,
        height,
        scale,
        isCompact,
        isSmallHeight,
        horizontalPadding: isCompact ? 18 : 24,
        panelRadius: rs(32),
        cardRadius: rs(24),
        heroRadius: rs(40),
        fabSize: rs(64),
        rs,
    };
};
