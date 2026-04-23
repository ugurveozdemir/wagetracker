import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, useResponsiveLayout } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'earnings' | 'hours' | 'loss';
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    style,
}) => {
    const { cardRadius, metrics } = useResponsiveLayout();
    const responsiveBase = { borderRadius: cardRadius, padding: metrics.cardPadding };

    if (variant === 'earnings') {
        return (
            <LinearGradient
                colors={[colors.emeraldGradientStart, colors.emeraldGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.base, responsiveBase, styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    if (variant === 'hours') {
        return (
            <LinearGradient
                colors={[colors.violetGradientStart, colors.violetGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.base, responsiveBase, styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    if (variant === 'loss') {
        return (
            <LinearGradient
                colors={[colors.secondary, colors.secondaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.base, responsiveBase, styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.base, responsiveBase, styles.default, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
    },
    default: {
        backgroundColor: colors.surfaceContainerLowest,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.06,
        shadowRadius: 40,
        elevation: 6,
    },
    gradient: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 8,
    },
});
