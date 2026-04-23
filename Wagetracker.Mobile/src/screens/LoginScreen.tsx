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
    const { isCompact, isShortHeight, horizontalPadding, metrics, rfs, rs, rv } = useResponsiveLayout();
    const brandFontSize = rfs(isCompact ? 22 : 25, 0.9, 1);
    const titleSize = rfs(isCompact ? 42 : 48, 0.82, 1.01);

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
        <View style={[styles.fieldBlock, { marginBottom: rv(isShortHeight ? 16 : 20, 0.75, 1) }]}>
            <Text style={[styles.fieldLabel, { fontSize: rfs(20, 0.86, 1), marginBottom: rv(12, 0.72, 1) }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        height: metrics.inputHeight,
                        borderRadius: metrics.inputHeight / 2,
                        paddingHorizontal: rs(20, 0.86, 1),
                        fontSize: rfs(18, 0.88, 1),
                    },
                    errorText ? styles.inputError : null,
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.slate400}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                {...extraProps}
            />
            {errorText ? <Text style={[styles.errorText, { fontSize: rfs(12, 0.9, 1), marginTop: rv(8, 0.7, 1) }]}>{errorText}</Text> : null}
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
                            paddingTop: rv(isShortHeight ? 18 : 28, 0.7, 1),
                            paddingBottom: rv(44, 0.74, 1),
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.brandRow, { marginBottom: rv(isShortHeight ? 24 : 40, 0.65, 1) }]}>
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

                    <View style={[styles.heroSection, { marginBottom: rv(isShortHeight ? 18 : 24, 0.72, 1) }]}>
                        <Text style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.1), marginBottom: rv(12, 0.7, 1) }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { fontSize: rfs(18, 0.88, 1), lineHeight: Math.round(rfs(18, 0.88, 1) * 1.4) }]}>Sign in to continue tracking your work and money.</Text>
                    </View>

                    {error ? (
                        <View style={[styles.errorBanner, { marginBottom: rv(20, 0.76, 1), paddingVertical: rv(12, 0.76, 1) }]}>
                            <Text style={[styles.errorBannerText, { fontSize: rfs(12, 0.9, 1) }]}>{error}</Text>
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
                        style={[styles.forgotPasswordRow, { marginTop: -rv(12, 0.7, 1), marginBottom: rv(20, 0.72, 1) }]}
                        onPress={() => navigation.navigate('ForgotPassword')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            {
                                height: metrics.primaryButtonHeight,
                                borderRadius: metrics.primaryButtonHeight / 2,
                            },
                            !isFormValid && styles.primaryButtonDisabled,
                        ]}
                        activeOpacity={0.88}
                        onPress={handleLogin}
                        disabled={!isFormValid || isLoading}
                    >
                        <Text style={[styles.primaryButtonText, { fontSize: rfs(18, 0.9, 1) }]}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
                    </TouchableOpacity>

                    <View style={[styles.footer, { marginTop: rv(isShortHeight ? 28 : 40, 0.7, 1), marginBottom: rv(12, 0.74, 1) }]}>
                        <Text style={[styles.footerText, { fontSize: rfs(18, 0.88, 1) }]}>Don’t have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
                            <Text style={[styles.footerLink, { fontSize: rfs(18, 0.88, 1) }]}>Sign Up</Text>
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
    forgotPasswordRow: {
        alignSelf: 'flex-end',
        marginTop: -spacing.md,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.xs,
    },
    forgotPasswordText: {
        color: colors.secondary,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
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
