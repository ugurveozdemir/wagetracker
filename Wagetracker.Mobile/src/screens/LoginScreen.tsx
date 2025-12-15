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
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { Button, Input } from '../components/ui';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginNavigationProp>();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await login(email.trim(), password);
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
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isLoading}
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
