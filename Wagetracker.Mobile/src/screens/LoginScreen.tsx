import React, { useState } from 'react';
import {
    Image,
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
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
import { colors, spacing, fontSizes, fontWeights, useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
const brandLogo = require('../../assets/logo.png');

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginNavigationProp>();
    const { login, isLoading, error, clearError } = useAuthStore();
    const { isCompact, horizontalPadding, rs } = useResponsiveLayout();

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
                        <View style={[styles.brandBadge, { width: rs(54), height: rs(54), borderRadius: rs(27) }]}> 
                            <Image source={brandLogo} style={{ width: rs(46), height: rs(46) }} resizeMode="contain" />
                        </View>
                        <Text style={[styles.brandText, { fontSize: isCompact ? 22 : 25 }]}>Chickaree</Text>
                    </View>

                    <View style={styles.heroSection}>
                        <Text style={[styles.title, { fontSize: isCompact ? 40 : 48, lineHeight: isCompact ? 44 : 52 }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { fontSize: isCompact ? 16 : 18 }]}>Sign in to continue tracking your work and money.</Text>
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
                        'Email Address',
                        email,
                        handleEmailChange,
                        'john@example.com',
                        emailError,
                        () => {
                            setTouched((prev) => ({ ...prev, email: true }));
                            setEmailError(validateEmail(email));
                        },
                        {
                            keyboardType: 'email-address',
                            autoCapitalize: 'none',
                            autoComplete: 'email',
                        }
                    )}

                    {renderField(
                        'Password',
                        password,
                        handlePasswordChange,
                        '••••••••',
                        passwordError,
                        () => {
                            setTouched((prev) => ({ ...prev, password: true }));
                            setPasswordError(validatePassword(password));
                        },
                        {
                            secureTextEntry: true,
                            autoComplete: 'password',
                        }
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
                        activeOpacity={0.88}
                        onPress={handleLogin}
                        disabled={!isFormValid || isLoading}
                    >
                        <Text style={styles.primaryButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don’t have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
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
    brandBadge: {
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
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
        marginTop: spacing.sm,
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
