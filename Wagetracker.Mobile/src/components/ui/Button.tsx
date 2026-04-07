import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            {variant === 'primary' ? (
                <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryFill}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
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
                </LinearGradient>
            ) : (
                <>
                    {loading ? (
                        <ActivityIndicator
                            color={variant === 'secondary' ? colors.onSecondary : colors.primary}
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
                </>
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
    primaryFill: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
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
