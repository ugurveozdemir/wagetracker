import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { Button, Input } from '../components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import Toast from 'react-native-toast-message';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<RegisterNavigationProp>();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

        try {
            await register(email.trim(), password, fullName.trim());
            Toast.show({
                type: 'success',
                text1: 'Account Created',
                text2: 'Welcome to WageTracker',
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
        !validateFullName(fullName) &&
        !validateEmail(email) &&
        !validatePassword(password) &&
        !validateConfirmPassword(confirmPassword, password);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceBright} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heroPanel}>
                        <Text style={styles.eyebrow}>Create Account</Text>
                        <Text style={styles.title}>Open a fresh page
                            {'\n'}
                            for your work.
                        </Text>
                        <Text style={styles.subtitle}>
                            Same stack, same API contracts, upgraded visual language.
                        </Text>
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={clearError}>
                                <Text style={styles.errorDismiss}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <View style={styles.formCard}>
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={fullName}
                            onChangeText={setFullName}
                            onBlur={() => setFullNameError(validateFullName(fullName))}
                            error={fullNameError}
                            autoCapitalize="words"
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            onBlur={() => setEmailError(validateEmail(email))}
                            error={emailError}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            onBlur={() => setPasswordError(validatePassword(password))}
                            error={passwordError}
                            secureTextEntry
                            autoComplete="password-new"
                        />

                        {password.length > 0 ? (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBarTrack}>
                                    {[1, 2, 3, 4].map((segment) => (
                                        <View
                                            key={segment}
                                            style={[
                                                styles.strengthBarSegment,
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
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                    {passwordStrength.label}
                                </Text>
                            </View>
                        ) : null}

                        <Input
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword, password))}
                            error={confirmPasswordError}
                            secureTextEntry
                            autoComplete="password-new"
                        />

                        <Button
                            title="Create Account"
                            onPress={handleRegister}
                            loading={isLoading}
                            disabled={!isFormValid}
                            size="lg"
                            fullWidth
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>Sign in</Text>
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
        justifyContent: 'center',
        padding: spacing.xl,
    },
    heroPanel: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.xl,
        padding: spacing['3xl'],
        marginBottom: spacing.xl,
    },
    eyebrow: {
        color: colors.primary,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginBottom: spacing.sm,
    },
    title: {
        color: colors.onSurface,
        fontSize: 34,
        fontWeight: fontWeights.extrabold,
        lineHeight: 38,
        marginBottom: spacing.md,
    },
    subtitle: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        lineHeight: 22,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.dangerBg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    errorText: {
        flex: 1,
        color: colors.danger,
        fontWeight: fontWeights.semibold,
        fontSize: fontSizes.sm,
    },
    errorDismiss: {
        color: colors.danger,
        fontSize: 20,
        fontWeight: fontWeights.bold,
        paddingLeft: spacing.md,
    },
    formCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        marginBottom: spacing.xl,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.05,
        shadowRadius: 40,
        elevation: 6,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    footerText: {
        color: colors.onSurfaceVariant,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
    },
    footerLink: {
        color: colors.primary,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.bold,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
    },
    strengthBarTrack: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
    },
    strengthBarSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        minWidth: 48,
        textAlign: 'right',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.bold,
    },
});
