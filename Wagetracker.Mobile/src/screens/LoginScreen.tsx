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

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginNavigationProp>();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false });

    // Email validation regex
    const validateEmail = (value: string): string => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
    };

    // Password validation
    const validatePassword = (value: string): string => {
        if (!value) return 'Password is required';
        return '';
    };

    // Handle email change
    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (touched.email) {
            setEmailError(validateEmail(value));
        }
    };

    // Handle password change
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) {
            setPasswordError(validatePassword(value));
        }
    };

    // Handle blur events
    const handleEmailBlur = () => {
        setTouched(prev => ({ ...prev, email: true }));
        setEmailError(validateEmail(email));
    };

    const handlePasswordBlur = () => {
        setTouched(prev => ({ ...prev, password: true }));
        setPasswordError(validatePassword(password));
    };

    // Check if form is valid
    const isFormValid = email.trim() && password && !validateEmail(email) && !validatePassword(password);

    const handleLogin = async () => {
        // Validate all fields
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);
        setTouched({ email: true, password: true });

        if (emailErr || passwordErr) {
            return;
        }

        try {
            await login(email.trim(), password);
            Toast.show({
                type: 'success',
                text1: 'Welcome back!',
                text2: 'Login successful',
                visibilityTime: 2000,
            });
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: err instanceof Error ? err.message : 'Please check your credentials',
                visibilityTime: 3000,
            });
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
                        <Text style={styles.logo}>💼</Text>
                        <Text style={styles.title}>WageTracker</Text>
                        <Text style={styles.subtitle}>Track your earnings with ease</Text>
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
                            autoComplete="password"
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={!isFormValid}
                            size="lg"
                            fullWidth
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}>Sign Up</Text>
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
        marginBottom: spacing['4xl'],
    },
    logo: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSizes['4xl'],
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
        marginBottom: spacing['3xl'],
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
