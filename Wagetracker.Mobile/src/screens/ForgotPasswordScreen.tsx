import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { authApi } from '../api';
import { AuthStackParamList } from '../types';
import { colors, fontSizes, fontWeights, spacing, useResponsiveLayout } from '../theme';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordNavigationProp>();
    const { isCompact, horizontalPadding, rs } = useResponsiveLayout();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [hasRequestedCode, setHasRequestedCode] = useState(false);

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
    };

    const validateCode = (value: string) => {
        if (!value.trim()) return 'Reset code is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Code must be 6 digits';
        return '';
    };

    const validateNewPassword = (value: string) => {
        if (!value) return 'New password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (value: string, password: string) => {
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
    };

    const handleSendCode = async () => {
        const emailValidation = validateEmail(email);
        setEmailError(emailValidation);
        if (emailValidation) {
            return;
        }

        try {
            setIsSendingCode(true);
            const response = await authApi.forgotPassword({ email: email.trim() });
            setHasRequestedCode(true);
            Toast.show({
                type: 'success',
                text1: 'Code Sent',
                text2: response.message,
                visibilityTime: 3500,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Request Failed',
                text2: error instanceof Error ? error.message : 'Could not send reset code',
                visibilityTime: 3000,
            });
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleResetPassword = async () => {
        const emailValidation = validateEmail(email);
        const codeValidation = validateCode(code);
        const newPasswordValidation = validateNewPassword(newPassword);
        const confirmPasswordValidation = validateConfirmPassword(confirmPassword, newPassword);

        setEmailError(emailValidation);
        setCodeError(codeValidation);
        setNewPasswordError(newPasswordValidation);
        setConfirmPasswordError(confirmPasswordValidation);

        if (emailValidation || codeValidation || newPasswordValidation || confirmPasswordValidation) {
            return;
        }

        try {
            setIsResettingPassword(true);
            const response = await authApi.resetPassword({
                email: email.trim(),
                code: code.trim(),
                newPassword,
            });

            Toast.show({
                type: 'success',
                text1: 'Password Updated',
                text2: response.message,
                visibilityTime: 2500,
            });
            navigation.navigate('Login');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Reset Failed',
                text2: error instanceof Error ? error.message : 'Invalid or expired code',
                visibilityTime: 3000,
            });
        } finally {
            setIsResettingPassword(false);
        }
    };

    const canSendCode = useMemo(() => {
        return email.trim().length > 0 && !validateEmail(email) && !isSendingCode;
    }, [email, isSendingCode]);

    const canResetPassword = useMemo(() => {
        return (
            hasRequestedCode &&
            email.trim().length > 0 &&
            code.trim().length > 0 &&
            newPassword.length > 0 &&
            confirmPassword.length > 0 &&
            !validateEmail(email) &&
            !validateCode(code) &&
            !validateNewPassword(newPassword) &&
            !validateConfirmPassword(confirmPassword, newPassword) &&
            !isResettingPassword
        );
    }, [hasRequestedCode, email, code, newPassword, confirmPassword, isResettingPassword]);

    const renderField = (
        label: string,
        value: string,
        setValue: (value: string) => void,
        placeholder: string,
        errorText: string,
        extraProps?: Partial<React.ComponentProps<typeof TextInput>>,
    ) => (
        <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[styles.input, errorText ? styles.inputError : null]}
                placeholder={placeholder}
                placeholderTextColor={colors.slate400}
                value={value}
                onChangeText={setValue}
                {...extraProps}
            />
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingHorizontal: horizontalPadding,
                            paddingTop: rs(24),
                            paddingBottom: rs(40),
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
                        <Text style={styles.backButtonLabel}>Back to Sign In</Text>
                    </TouchableOpacity>

                    <View style={styles.heroSection}>
                        <Text style={[styles.title, { fontSize: isCompact ? 34 : 40 }]}>Reset Password</Text>
                        <Text style={[styles.subtitle, { fontSize: isCompact ? 15 : 17 }]}>Enter your email, get a 6-digit code, then choose a new password.</Text>
                    </View>

                    {renderField(
                        'Email Address',
                        email,
                        (value) => {
                            setEmail(value);
                            if (emailError) {
                                setEmailError(validateEmail(value));
                            }
                        },
                        'john@example.com',
                        emailError,
                        {
                            keyboardType: 'email-address',
                            autoCapitalize: 'none',
                            autoComplete: 'email',
                        },
                    )}

                    <TouchableOpacity
                        style={[styles.secondaryButton, !canSendCode && styles.buttonDisabled]}
                        onPress={handleSendCode}
                        disabled={!canSendCode}
                        activeOpacity={0.88}
                    >
                        <Text style={styles.secondaryButtonText}>{isSendingCode ? 'Sending...' : hasRequestedCode ? 'Resend Code' : 'Send Code'}</Text>
                    </TouchableOpacity>

                    {hasRequestedCode ? (
                        <>
                            <View style={styles.divider} />

                            {renderField(
                                'Reset Code',
                                code,
                                (value) => {
                                    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
                                    setCode(cleaned);
                                    if (codeError) {
                                        setCodeError(validateCode(cleaned));
                                    }
                                },
                                '123456',
                                codeError,
                                {
                                    keyboardType: 'number-pad',
                                    maxLength: 6,
                                    autoComplete: 'one-time-code',
                                },
                            )}

                            {renderField(
                                'New Password',
                                newPassword,
                                (value) => {
                                    setNewPassword(value);
                                    if (newPasswordError) {
                                        setNewPasswordError(validateNewPassword(value));
                                    }
                                    if (confirmPasswordError) {
                                        setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
                                    }
                                },
                                '••••••••',
                                newPasswordError,
                                {
                                    secureTextEntry: true,
                                    autoComplete: 'password-new',
                                },
                            )}

                            {renderField(
                                'Confirm Password',
                                confirmPassword,
                                (value) => {
                                    setConfirmPassword(value);
                                    if (confirmPasswordError) {
                                        setConfirmPasswordError(validateConfirmPassword(value, newPassword));
                                    }
                                },
                                '••••••••',
                                confirmPasswordError,
                                {
                                    secureTextEntry: true,
                                    autoComplete: 'password-new',
                                },
                            )}

                            <TouchableOpacity
                                style={[styles.primaryButton, !canResetPassword && styles.buttonDisabled]}
                                onPress={handleResetPassword}
                                disabled={!canResetPassword}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.primaryButtonText}>{isResettingPassword ? 'Updating...' : 'Reset Password'}</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.surfaceBright,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    backButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xl,
    },
    backButtonLabel: {
        color: colors.onSurface,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
    },
    heroSection: {
        marginBottom: spacing['2xl'],
    },
    title: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
        lineHeight: 46,
        marginBottom: spacing.md,
    },
    subtitle: {
        color: colors.onSurface,
        fontWeight: fontWeights.medium,
        lineHeight: 26,
    },
    fieldBlock: {
        marginBottom: spacing.lg,
    },
    fieldLabel: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    input: {
        height: 66,
        borderRadius: 33,
        backgroundColor: colors.surfaceContainerHigh,
        paddingHorizontal: spacing.xl,
        fontSize: 18,
        color: colors.onSurface,
    },
    inputError: {
        borderWidth: 1,
        borderColor: 'rgba(186, 26, 26, 0.24)',
    },
    errorText: {
        color: colors.danger,
        fontSize: fontSizes.sm,
        marginTop: spacing.sm,
        marginLeft: spacing.sm,
    },
    secondaryButton: {
        height: 62,
        borderRadius: 31,
        backgroundColor: colors.surfaceContainerHighest,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    secondaryButtonText: {
        color: colors.onSurface,
        fontSize: 16,
        fontWeight: fontWeights.bold,
    },
    divider: {
        height: 1,
        backgroundColor: colors.outlineVariant,
        marginVertical: spacing['2xl'],
    },
    primaryButton: {
        height: 68,
        borderRadius: 34,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    primaryButtonText: {
        color: colors.onPrimary,
        fontSize: 18,
        fontWeight: fontWeights.extrabold,
    },
    buttonDisabled: {
        opacity: 0.55,
    },
});
