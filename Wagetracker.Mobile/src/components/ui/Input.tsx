import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../../theme';

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
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputWrapper,
                    multiline ? styles.inputWrapperMultiline : undefined,
                    error && styles.inputError,
                ]}
            >
                {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        multiline ? styles.inputMultiline : undefined,
                        leftIcon ? styles.inputWithIcon : undefined,
                        style,
                    ]}
                    placeholderTextColor={colors.slate300}
                    multiline={multiline}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
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
