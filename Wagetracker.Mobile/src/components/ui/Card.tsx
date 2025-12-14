import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'earnings' | 'hours';
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    style,
}) => {
    if (variant === 'earnings') {
        return (
            <LinearGradient
                colors={[colors.emeraldGradientStart, colors.emeraldGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.base, styles.gradient, style]}
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
                style={[styles.base, styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.base, styles.default, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius['3xl'],
        padding: spacing.lg,
    },
    default: {
        backgroundColor: colors.white,
        shadowColor: colors.slate900,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    gradient: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
});
