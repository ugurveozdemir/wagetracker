import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSizes, fontWeights, useResponsiveLayout } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    containerStyle,
    style,
    multiline,
    ...props
}) => {
    const { metrics, rfs, rv, rs } = useResponsiveLayout();

    return (
        <View style={[styles.container, { marginBottom: rv(16, 0.78, 1) }, containerStyle]}>
            {label && <Text style={[styles.label, { fontSize: rfs(10, 0.9, 1) }]}>{label}</Text>}
            <View
                style={[
                    styles.inputWrapper,
                    {
                        minHeight: multiline ? undefined : metrics.inputHeight,
                        borderRadius: multiline ? rs(32, 0.86, 1) : borderRadius.full,
                    },
                    multiline ? styles.inputWrapperMultiline : undefined,
                    error && styles.inputError,
                ]}
            >
                {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        {
                            fontSize: rfs(18, 0.88, 1),
                            paddingVertical: rv(16, 0.76, 1),
                            paddingHorizontal: rs(16, 0.86, 1),
                        },
                        multiline ? styles.inputMultiline : undefined,
                        multiline ? { minHeight: rv(96, 0.78, 1) } : undefined,
                        leftIcon ? styles.inputWithIcon : undefined,
                        style,
                    ]}
                    placeholderTextColor={colors.slate300}
                    multiline={multiline}
                    {...props}
                />
            </View>
            {error && <Text style={[styles.errorText, { fontSize: rfs(12, 0.9, 1) }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerHighest,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: colors.transparent,
    },
    inputWrapperMultiline: {
        borderRadius: borderRadius.lg,
        alignItems: 'flex-start',
    },
    inputError: {
        borderColor: 'rgba(186, 26, 26, 0.2)',
    },
    iconContainer: {
        paddingLeft: spacing.lg,
    },
    input: {
        flex: 1,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: colors.onSurface,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    inputMultiline: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
    inputWithIcon: {
        paddingLeft: spacing.md,
    },
    errorText: {
        fontSize: fontSizes.sm,
        color: colors.danger,
        marginTop: spacing.xs,
        marginLeft: spacing.sm,
    },
});
