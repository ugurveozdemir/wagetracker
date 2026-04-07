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

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
    };

    const validatePassword = (value: string) => {
        if (!value) return 'Password is required';
        return '';
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (touched.email) {
            setEmailError(validateEmail(value));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) {
            setPasswordError(validatePassword(value));
        }
    };

    const handleLogin = async () => {
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
                text1: 'Welcome back',
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

    const isFormValid = email.trim() && password && !validateEmail(email) && !validatePassword(password);

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
                        <Text style={styles.eyebrow}>WageTracker</Text>
                        <Text style={styles.title}>Your ledger,
                            {'\n'}
                            framed softly.
                        </Text>
                        <Text style={styles.subtitle}>
                            Sign in to keep tracking earnings and expenses with the same backend workflow.
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
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={handleEmailChange}
                            onBlur={() => {
                                setTouched((prev) => ({ ...prev, email: true }));
                                setEmailError(validateEmail(email));
                            }}
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
                            onBlur={() => {
                                setTouched((prev) => ({ ...prev, password: true }));
                                setPasswordError(validatePassword(password));
                            }}
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

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don’t have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}>Create one</Text>
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
        fontSize: 36,
        fontWeight: fontWeights.extrabold,
        lineHeight: 40,
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
});
