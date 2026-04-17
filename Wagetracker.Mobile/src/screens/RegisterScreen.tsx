import React, { useState } from 'react';
import {
    Image,
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Linking,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { config } from '../config';
import { colors, spacing, fontSizes, fontWeights, useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
const brandLogo = require('../../assets/logo.png');

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<RegisterNavigationProp>();
    const { register, isLoading, error, clearError } = useAuthStore();
    const { isCompact, horizontalPadding, rs } = useResponsiveLayout();
    const brandFontSize = isCompact ? 22 : 25;

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToPolicies, setAgreedToPolicies] = useState(false);
    const [fullNameError, setFullNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const validateFullName = (value: string) => {
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
    };

    const validatePassword = (value: string) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (value: string, pwd: string) => {
        if (!value) return 'Please confirm your password';
        if (value !== pwd) return 'Passwords do not match';
        return '';
    };

    const getPasswordStrength = (value: string): { level: number; label: string; color: string } => {
        if (!value) return { level: 0, label: '', color: colors.slate200 };

        let score = 0;
        if (value.length >= 6) score++;
        if (value.length >= 10) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        if (score <= 1) return { level: 1, label: 'Weak', color: colors.danger };
        if (score <= 2) return { level: 2, label: 'Fair', color: colors.orange };
        if (score <= 3) return { level: 3, label: 'Good', color: '#d9a400' };
        return { level: 4, label: 'Strong', color: colors.primary };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleRegister = async () => {
        const nameErr = validateFullName(fullName);
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        const confirmErr = validateConfirmPassword(confirmPassword, password);

        setFullNameError(nameErr);
        setEmailError(emailErr);
        setPasswordError(passwordErr);
        setConfirmPasswordError(confirmErr);

        if (nameErr || emailErr || passwordErr || confirmErr) {
            return;
        }

        if (!agreedToPolicies) {
            Toast.show({
                type: 'info',
                text1: 'Agreement Required',
                text2: 'Please accept the terms to continue.',
                visibilityTime: 2500,
            });
            return;
        }

        try {
            await register(email.trim(), password, fullName.trim());
            Toast.show({
                type: 'success',
                text1: 'Account Created',
                text2: 'Welcome to Chickaree',
                visibilityTime: 2000,
            });
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: err instanceof Error ? err.message : 'Please try again',
                visibilityTime: 3000,
            });
        }
    };

    const isFormValid =
        fullName.trim() &&
        email.trim() &&
        password &&
        confirmPassword &&
        agreedToPolicies &&
        !validateFullName(fullName) &&
        !validateEmail(email) &&
        !validatePassword(password) &&
        !validateConfirmPassword(confirmPassword, password);

    const renderField = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder: string,
        errorText: string,
        onBlur: () => void,
        extraProps?: Partial<React.ComponentProps<typeof TextInput>>,
    ) => (
        <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[styles.input, errorText ? styles.inputError : null]}
                placeholder={placeholder}
                placeholderTextColor={colors.slate400}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
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
                            paddingTop: rs(28),
                            paddingBottom: rs(44),
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.brandRow}>
                        <Image source={brandLogo} style={{ width: rs(46), height: rs(46) }} resizeMode="contain" />
                        <Text
                            style={[
                                styles.brandText,
                                {
                                    fontSize: brandFontSize,
                                    lineHeight: brandFontSize + 2,
                                    transform: [{ translateY: rs(5, 1) }],
                                },
                            ]}
                        >
                            Chickaree
                        </Text>
                    </View>

                    <View style={styles.heroSection}>
                        <Text style={[styles.title, { fontSize: isCompact ? 40 : 48, lineHeight: isCompact ? 44 : 52 }]}>Start Your Journey</Text>
                        <Text style={[styles.subtitle, { fontSize: isCompact ? 16 : 18 }]}>Create your account to get started.</Text>
                    </View>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>{error}</Text>
                            <TouchableOpacity onPress={clearError} activeOpacity={0.7}>
                                <MaterialIcons name="close" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {renderField(
                        'Full Name',
                        fullName,
                        setFullName,
                        'John Doe',
                        fullNameError,
                        () => setFullNameError(validateFullName(fullName)),
                        {
                            autoCapitalize: 'words',
                            autoComplete: 'name',
                        }
                    )}

                    {renderField(
                        'Email Address',
                        email,
                        setEmail,
                        'john@example.com',
                        emailError,
                        () => setEmailError(validateEmail(email)),
                        {
                            keyboardType: 'email-address',
                            autoCapitalize: 'none',
                            autoComplete: 'email',
                        }
                    )}

                    {renderField(
                        'Password',
                        password,
                        setPassword,
                        '••••••••',
                        passwordError,
                        () => setPasswordError(validatePassword(password)),
                        {
                            secureTextEntry: true,
                            autoComplete: 'password-new',
                        }
                    )}

                    {password.length > 0 ? (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthTrack}>
                                {[1, 2, 3, 4].map((segment) => (
                                    <View
                                        key={segment}
                                        style={[
                                            styles.strengthSegment,
                                            {
                                                backgroundColor:
                                                    segment <= passwordStrength.level
                                                        ? passwordStrength.color
                                                        : colors.slate200,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                        </View>
                    ) : null}

                    {renderField(
                        'Confirm Password',
                        confirmPassword,
                        setConfirmPassword,
                        '••••••••',
                        confirmPasswordError,
                        () => setConfirmPasswordError(validateConfirmPassword(confirmPassword, password)),
                        {
                            secureTextEntry: true,
                            autoComplete: 'password-new',
                        }
                    )}

                    <TouchableOpacity
                        style={styles.policyRow}
                        activeOpacity={0.85}
                        onPress={() => setAgreedToPolicies((current) => !current)}
                    >
                        <View style={[styles.checkbox, agreedToPolicies && styles.checkboxActive]}>
                            {agreedToPolicies ? <MaterialIcons name="check" size={16} color={colors.onPrimary} /> : null}
                        </View>
                        <Text style={styles.policyText}>
                            I agree to the{' '}
                            <Text style={styles.policyLink} onPress={() => Linking.openURL(config.TERMS_URL)}>
                                Terms & Conditions
                            </Text>
                            {' '}and{' '}
                            <Text style={styles.policyLink} onPress={() => Linking.openURL(config.PRIVACY_URL)}>
                                Privacy Policy
                            </Text>
                            .
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
                        activeOpacity={0.88}
                        onPress={handleRegister}
                        disabled={!isFormValid || isLoading}
                    >
                        <Text style={styles.primaryButtonText}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
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
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 0.01,
        marginBottom: spacing['4xl'],
    },
    brandText: {
        color: colors.primary,
        fontSize: 25,
        fontWeight: fontWeights.extrabold,
    },
    heroSection: {
        marginBottom: spacing['2xl'],
    },
    title: {
        color: colors.primary,
        fontWeight: fontWeights.extrabold,
        marginBottom: spacing.md,
    },
    subtitle: {
        color: colors.onSurface,
        fontWeight: fontWeights.medium,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.dangerBg,
        borderRadius: 20,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    errorBannerText: {
        flex: 1,
        color: colors.danger,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.semibold,
    },
    fieldBlock: {
        marginBottom: spacing.xl,
    },
    fieldLabel: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    input: {
        height: 72,
        borderRadius: 36,
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
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginTop: -spacing.md,
        marginBottom: spacing.xl,
    },
    strengthTrack: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
    },
    strengthSegment: {
        flex: 1,
        height: 5,
        borderRadius: 999,
    },
    strengthLabel: {
        minWidth: 52,
        fontSize: fontSizes.xs,
        textAlign: 'right',
        fontWeight: fontWeights.bold,
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginTop: spacing.sm,
        marginBottom: spacing['2xl'],
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    policyText: {
        flex: 1,
        color: colors.onSurface,
        fontSize: fontSizes.lg,
        lineHeight: 28,
    },
    policyLink: {
        color: colors.primary,
        fontWeight: fontWeights.bold,
    },
    primaryButton: {
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 22,
        elevation: 8,
    },
    primaryButtonDisabled: {
        opacity: 0.55,
    },
    primaryButtonText: {
        color: colors.onPrimary,
        fontSize: 18,
        fontWeight: fontWeights.extrabold,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing['4xl'],
        marginBottom: spacing.md,
    },
    footerText: {
        color: colors.onSurface,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.medium,
    },
    footerLink: {
        color: colors.secondary,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
    },
});
