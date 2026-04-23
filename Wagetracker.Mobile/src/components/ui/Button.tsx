import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSizes, fontWeights, useResponsiveLayout } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;
    const { metrics, rfs, rv, rs } = useResponsiveLayout();
    const sizeMetrics = {
        sm: {
            minHeight: Math.max(metrics.touchTarget, Math.round(rv(40, 0.9, 1))),
            paddingVertical: rv(8, 0.82, 1),
            paddingHorizontal: rs(16, 0.9, 1.02),
            fontSize: rfs(12, 0.9, 1),
        },
        md: {
            minHeight: Math.max(metrics.touchTarget, Math.round(rv(48, 0.88, 1))),
            paddingVertical: rv(12, 0.8, 1),
            paddingHorizontal: rs(20, 0.88, 1.02),
            fontSize: rfs(14, 0.9, 1),
        },
        lg: {
            minHeight: metrics.buttonHeight,
            paddingVertical: rv(16, 0.78, 1),
            paddingHorizontal: rs(24, 0.86, 1.02),
            fontSize: rfs(16, 0.9, 1),
        },
    }[size];

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                styles[size],
                {
                    minHeight: sizeMetrics.minHeight,
                    paddingVertical: sizeMetrics.paddingVertical,
                    paddingHorizontal: sizeMetrics.paddingHorizontal,
                },
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'secondary'
                            ? colors.onSecondary
                            : variant === 'primary'
                              ? colors.onPrimary
                              : colors.primary
                    }
                    size="small"
                />
            ) : (
                <Text
                    style={[
                        styles.text,
                        styles[`${variant}Text`],
                        styles[`${size}Text`],
                        { fontSize: sizeMetrics.fontSize },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
    secondary: {
        backgroundColor: colors.secondaryContainer,
    },
    ghost: {
        backgroundColor: colors.surfaceContainerLow,
    },
    // Sizes
    sm: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        minHeight: 36,
    },
    md: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        minHeight: 44,
    },
    lg: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'],
        minHeight: 56,
    },

    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },

    // Text styles
    text: {
        fontWeight: fontWeights.bold,
        letterSpacing: 0.3,
    },
    primaryText: {
        color: colors.onPrimary,
    },
    secondaryText: {
        color: colors.onSecondary,
    },
    ghostText: {
        color: colors.primary,
    },
    smText: {
        fontSize: fontSizes.sm,
    },
    mdText: {
        fontSize: fontSizes.base,
    },
    lgText: {
        fontSize: fontSizes.lg,
    },
});
