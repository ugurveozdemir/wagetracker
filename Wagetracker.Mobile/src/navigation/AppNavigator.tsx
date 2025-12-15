import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from '../types';
import { useAuthStore } from '../stores';
import { colors } from '../theme';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Main Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// Auth Navigator
const AuthNavigator: React.FC = () => {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.slate50 },
                animation: 'slide_from_right',
            }}
        >
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
};

// Main Navigator (after login)
const MainNavigator: React.FC = () => {
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.slate50 },
                animation: 'slide_from_right',
            }}
        >
            <MainStack.Screen name="Dashboard" component={DashboardScreen} />
            <MainStack.Screen name="JobDetails" component={JobDetailsScreen} />
        </MainStack.Navigator>
    );
};

// Root Navigator with auth state management
export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <RootStack.Screen name="Main" component={MainNavigator} />
                ) : (
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.slate50,
    },
});
