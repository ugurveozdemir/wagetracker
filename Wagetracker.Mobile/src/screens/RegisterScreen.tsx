import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { Button, Input } from '../components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<RegisterNavigationProp>();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Error states
    const [fullNameError, setFullNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [touched, setTouched] = useState({
        fullName: false,
        email: false,
        password: false,
        confirmPassword: false,
    });

    // Validation functions
    const validateFullName = (value: string): string => {
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
    };

    const validateEmail = (value: string): string => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
    };

    const validatePassword = (value: string): string => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (value: string, pwd: string): string => {
        if (!value) return 'Please confirm your password';
        if (value !== pwd) return 'Passwords do not match';
        return '';
    };

    // Change handlers
    const handleFullNameChange = (value: string) => {
        setFullName(value);
        if (touched.fullName) setFullNameError(validateFullName(value));
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (touched.email) setEmailError(validateEmail(value));
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) setPasswordError(validatePassword(value));
        // Also validate confirm password if it was touched
        if (touched.confirmPassword) {
            setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
        }
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        if (touched.confirmPassword) {
            setConfirmPasswordError(validateConfirmPassword(value, password));
        }
    };

    // Blur handlers
    const handleFullNameBlur = () => {
        setTouched(prev => ({ ...prev, fullName: true }));
        setFullNameError(validateFullName(fullName));
    };

    const handleEmailBlur = () => {
        setTouched(prev => ({ ...prev, email: true }));
        setEmailError(validateEmail(email));
    };

    const handlePasswordBlur = () => {
        setTouched(prev => ({ ...prev, password: true }));
        setPasswordError(validatePassword(password));
    };

    const handleConfirmPasswordBlur = () => {
        setTouched(prev => ({ ...prev, confirmPassword: true }));
        setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
    };

    // Check if form is valid
    const isFormValid =
        fullName.trim() &&
        email.trim() &&
        password &&
        confirmPassword &&
        !validateFullName(fullName) &&
        !validateEmail(email) &&
        !validatePassword(password) &&
        !validateConfirmPassword(confirmPassword, password);

    const handleRegister = async () => {
        // Validate all fields
        const nameErr = validateFullName(fullName);
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        const confirmErr = validateConfirmPassword(confirmPassword, password);

        setFullNameError(nameErr);
        setEmailError(emailErr);
        setPasswordError(passwordErr);
        setConfirmPasswordError(confirmErr);
        setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

        if (nameErr || emailErr || passwordErr || confirmErr) {
            return;
        }

        try {
            await register(email.trim(), password, fullName.trim());
        } catch (err) {
            // Error is handled by the store
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.slate50} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🚀</Text>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start tracking your earnings</Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={clearError}>
                                <Text style={styles.errorDismiss}>×</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={fullName}
                            onChangeText={handleFullNameChange}
                            onBlur={handleFullNameBlur}
                            error={fullNameError}
                            autoCapitalize="words"
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={handleEmailChange}
                            onBlur={handleEmailBlur}
                            error={emailError}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            error={passwordError}
                            secureTextEntry
                            autoComplete="password-new"
                        />

                        <Input
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            onBlur={handleConfirmPasswordBlur}
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

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
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
        backgroundColor: colors.slate50,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.xl,
        justifyContent: 'center',
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    logo: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.extrabold,
        color: colors.slate800,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.medium,
        color: colors.slate400,
    },

    // Error
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.orangeBg,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.orangeLight,
    },
    errorText: {
        flex: 1,
        color: colors.orange,
        fontWeight: fontWeights.semibold,
        fontSize: fontSizes.sm,
    },
    errorDismiss: {
        fontSize: 20,
        fontWeight: fontWeights.bold,
        color: colors.orange,
        paddingLeft: spacing.md,
    },

    // Form
    form: {
        marginBottom: spacing['2xl'],
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    footerText: {
        fontSize: fontSizes.base,
        color: colors.slate400,
        fontWeight: fontWeights.medium,
    },
    footerLink: {
        fontSize: fontSizes.base,
        color: colors.primary,
        fontWeight: fontWeights.bold,
    },
});
