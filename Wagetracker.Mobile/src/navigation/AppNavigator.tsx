import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import {
    ActivityIndicator,
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Platform,
} from 'react-native';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    RootStackParamList,
    AuthStackParamList,
    HomeStackParamList,
    TabParamList,
} from '../types';
import { useAuthStore } from '../stores';
import { colors, spacing, fontWeights } from '../theme';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Main Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Modals
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddEntryModal } from '../components/AddEntryModal';
import { CreateJobModal } from '../components/CreateJobModal';

// Context for "+" button action
type AddAction = {
    openAddEntry: (jobId: number) => void;
    openAddExpense: () => void;
    openCreateJob: () => void;
    setCurrentJobId: (jobId: number | null) => void;
    setCurrentScreen: (screen: string) => void;
};

export const AddActionContext = createContext<AddAction>({
    openAddEntry: () => {},
    openAddExpense: () => {},
    openCreateJob: () => {},
    setCurrentJobId: () => {},
    setCurrentScreen: () => {},
});

export const useAddAction = () => useContext(AddActionContext);

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

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

// Home Stack (Dashboard + JobDetails)
const HomeNavigator: React.FC = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.slate50 },
                animation: 'slide_from_right',
            }}
        >
            <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
            <HomeStack.Screen name="JobDetails" component={JobDetailsScreen} />
        </HomeStack.Navigator>
    );
};

// Dummy component for the Add tab (never rendered)
const DummyScreen: React.FC = () => <View />;

// Custom Tab Bar
const CustomTabBar: React.FC<any> = ({
    state,
    descriptors,
    navigation,
    onAddPress,
}) => {
    const tabs = [
        { name: 'HomeTab', icon: '🏠', label: 'Home' },
        { name: 'ExpensesTab', icon: '💸', label: 'Expenses' },
        { name: 'AddTab', icon: '+', label: 'Add', isCenter: true },
        { name: 'OverviewTab', icon: '📊', label: 'Overview' },
        { name: 'ProfileTab', icon: '👤', label: 'Profile' },
    ];

    return (
        <View style={tabStyles.container}>
            <View style={tabStyles.bar}>
                {tabs.map((tab, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        if (tab.isCenter) {
                            onAddPress(state);
                            return;
                        }

                        const event = navigation.emit({
                            type: 'tabPress',
                            target: state.routes[index]?.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(tab.name);
                        }
                    };

                    // Center "+" button
                    if (tab.isCenter) {
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                style={tabStyles.centerButton}
                                onPress={onPress}
                                activeOpacity={0.8}
                            >
                                <View style={tabStyles.centerButtonInner}>
                                    <Text style={tabStyles.centerButtonIcon}>+</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={tabStyles.tab}
                            onPress={onPress}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    tabStyles.tabIcon,
                                    !isFocused && tabStyles.tabIconInactive,
                                ]}
                            >
                                {tab.icon}
                            </Text>
                            <Text
                                style={[
                                    tabStyles.tabLabel,
                                    isFocused
                                        ? tabStyles.tabLabelActive
                                        : tabStyles.tabLabelInactive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const tabStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.slate100,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabIcon: {
        fontSize: 22,
        marginBottom: 2,
    },
    tabIconInactive: {
        opacity: 0.4,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: fontWeights.semibold,
    },
    tabLabelActive: {
        color: colors.primary,
    },
    tabLabelInactive: {
        color: colors.slate400,
    },
    centerButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -24,
    },
    centerButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    centerButtonIcon: {
        fontSize: 32,
        fontWeight: fontWeights.bold,
        color: colors.white,
        lineHeight: 34,
    },
});

// Helper: extract the active route name from nested nav state
function getActiveRouteName(state: any): { routeName: string; params?: any } {
    if (!state) return { routeName: 'Dashboard' };

    const route = state.routes[state.index];

    // If there's a nested navigator
    if (route.state) {
        return getActiveRouteName(route.state);
    }

    return { routeName: route.name, params: route.params };
}

// Main Tab Navigator
const MainNavigator: React.FC = () => {
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [activeJobId, setActiveJobId] = useState<number | null>(null);

    const handleAddPress = (tabState: any) => {
        // Determine current active tab
        const activeTabRoute = tabState.routes[tabState.index];
        const tabName = activeTabRoute.name;

        if (tabName === 'ExpensesTab') {
            // On Expenses screen → add expense
            setShowExpenseModal(true);
        } else if (tabName === 'HomeTab') {
            // Check if we're inside JobDetails or Dashboard
            const nestedState = activeTabRoute.state;
            if (nestedState) {
                const innerRoute = nestedState.routes[nestedState.index];
                if (innerRoute.name === 'JobDetails' && innerRoute.params?.jobId) {
                    // Inside a job → add entry
                    setActiveJobId(innerRoute.params.jobId);
                    setShowEntryModal(true);
                    return;
                }
            }
            // On Dashboard → create job
            setShowJobModal(true);
        } else {
            // Overview, Profile → default to add expense
            setShowExpenseModal(true);
        }
    };

    return (
        <>
            <Tab.Navigator
                tabBar={(props) => (
                    <CustomTabBar {...props} onAddPress={handleAddPress} />
                )}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tab.Screen name="HomeTab" component={HomeNavigator} />
                <Tab.Screen name="ExpensesTab" component={ExpensesScreen} />
                <Tab.Screen name="AddTab" component={DummyScreen} />
                <Tab.Screen name="OverviewTab" component={OverviewScreen} />
                <Tab.Screen name="ProfileTab" component={ProfileScreen} />
            </Tab.Navigator>

            {/* Global Modals */}
            <AddExpenseModal
                visible={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                onCreated={() => setShowExpenseModal(false)}
            />
            <CreateJobModal
                visible={showJobModal}
                onClose={() => setShowJobModal(false)}
                onCreated={() => setShowJobModal(false)}
            />
            {activeJobId && (
                <AddEntryModal
                    visible={showEntryModal}
                    jobId={activeJobId}
                    onClose={() => {
                        setShowEntryModal(false);
                        setActiveJobId(null);
                    }}
                    onCreated={() => {
                        setShowEntryModal(false);
                        setActiveJobId(null);
                    }}
                />
            )}
        </>
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
