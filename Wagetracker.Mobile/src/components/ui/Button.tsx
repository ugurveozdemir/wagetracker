import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../../theme';

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

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                styles[size],
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
                    color={variant === 'primary' ? colors.white : colors.primary}
                    size="small"
                />
            ) : (
                <Text
                    style={[
                        styles.text,
                        styles[`${variant}Text`],
                        styles[`${size}Text`],
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
        borderRadius: borderRadius['3xl'],
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondary: {
        backgroundColor: colors.slate100,
        borderWidth: 1,
        borderColor: colors.slate200,
    },
    ghost: {
        backgroundColor: colors.transparent,
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
    },
    primaryText: {
        color: colors.white,
    },
    secondaryText: {
        color: colors.slate700,
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
