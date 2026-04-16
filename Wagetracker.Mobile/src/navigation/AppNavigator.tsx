import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    AppState,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
    AuthStackParamList,
    ExpenseStackParamList,
    GoalStackParamList,
    HomeStackParamList,
    OverviewStackParamList,
    RootStackParamList,
    TabParamList,
} from '../types';
import { useAuthStore, useExpenseStore, useJobsStore, useOnboardingStore, useSubscriptionStore } from '../stores';
import { colors } from '../theme';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { RegistrationSurveyScreen } from '../screens/RegistrationSurveyScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { GoalScreen } from '../screens/GoalScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { ExpenseHistoryScreen } from '../screens/ExpenseHistoryScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { PremiumFeatureScreen } from '../screens/PremiumFeatureScreen';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddEntryModal } from '../components/AddEntryModal';
import { CreateJobModal } from '../components/CreateJobModal';
import { LockedFeatureModal } from '../components/LockedFeaturePreview';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExpenseStack = createNativeStackNavigator<ExpenseStackParamList>();
const OverviewStack = createNativeStackNavigator<OverviewStackParamList>();
const GoalStack = createNativeStackNavigator<GoalStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const AuthNavigator: React.FC = () => {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surface },
                animation: 'slide_from_right',
            }}
        >
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
};

const HomeNavigator: React.FC = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surface },
                animation: 'slide_from_right',
            }}
        >
            <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
            <HomeStack.Screen name="Goal" component={GoalScreen} />
            <HomeStack.Screen name="JobDetails" component={JobDetailsScreen} />
        </HomeStack.Navigator>
    );
};

const OverviewNavigator: React.FC = () => {
    return (
        <OverviewStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surface },
                animation: 'slide_from_right',
            }}
        >
            <OverviewStack.Screen name="Overview" component={OverviewScreen} />
            <OverviewStack.Screen name="JobDetails" component={JobDetailsScreen} />
        </OverviewStack.Navigator>
    );
};

const ExpenseNavigator: React.FC = () => {
    return (
        <ExpenseStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surface },
                animation: 'slide_from_right',
            }}
        >
            <ExpenseStack.Screen name="Expenses" component={ExpensesScreen} />
            <ExpenseStack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} />
        </ExpenseStack.Navigator>
    );
};

const GoalNavigator: React.FC = () => {
    return (
        <GoalStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surface },
                animation: 'slide_from_right',
            }}
        >
            <GoalStack.Screen name="Goal" component={GoalScreen} />
        </GoalStack.Navigator>
    );
};

const LockedGoalScreen: React.FC = () => <PremiumFeatureScreen feature="goals" />;
const LockedExpensesScreen: React.FC = () => <PremiumFeatureScreen feature="expenses" />;
const DummyScreen: React.FC = () => <View style={{ flex: 1, backgroundColor: '#fbf9f1' }} />;

const visibleTabs = [
    { routeName: 'HomeTab', icon: 'dashboard', label: 'Dashboard' },
    { routeName: 'GoalTab', icon: 'track-changes', label: 'Goal' },
    { routeName: 'OverviewTab', icon: 'work', label: 'Jobs' },
    { routeName: 'ExpensesTab', icon: 'payments', label: 'Expenses' },
    { routeName: 'ProfileTab', icon: 'person', label: 'Profile' },
] as const;

const CustomTabBar: React.FC<any> = ({ state, navigation, onAddPress }) => {
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const activeRouteName = state.routes[state.index]?.name;
    const activeRoute = state.routes[state.index];
    const nestedState = activeRoute?.state;
    const nestedRoute = nestedState?.routes?.[nestedState.index ?? 0];
    const isDashboardJobDetails = activeRouteName === 'HomeTab' && nestedRoute?.name === 'JobDetails';
    const showFab = isDashboardJobDetails || activeRouteName === 'OverviewTab' || (activeRouteName === 'ExpensesTab' && user?.access.canUseExpenses);
    const compact = width < 380;
    const tabScale = Math.min(Math.max(width / 393, 0.84), 1);

    return (
        <View pointerEvents="box-none" style={tabStyles.wrapper}>
            {showFab ? (
                <TouchableOpacity
                    style={[
                        tabStyles.fab,
                        {
                            right: compact ? 18 : 24,
                            bottom: compact ? 102 : 112,
                            width: 64 * tabScale,
                            height: 64 * tabScale,
                            borderRadius: 32 * tabScale,
                        },
                    ]}
                    onPress={() => onAddPress(state)}
                    activeOpacity={0.9}
                >
                    <MaterialIcons name="add" size={Math.round(34 * tabScale)} color={colors.white} />
                </TouchableOpacity>
            ) : null}

            <View
                style={[
                    tabStyles.footer,
                    {
                        paddingHorizontal: compact ? 8 : 16,
                        paddingTop: compact ? 12 : 16,
                        paddingBottom: Platform.OS === 'ios' ? (compact ? 26 : 32) : compact ? 18 : 24,
                        borderTopLeftRadius: compact ? 36 : 48,
                        borderTopRightRadius: compact ? 36 : 48,
                    },
                ]}
            >
                {visibleTabs.map((tab) => {
                    const routeIndex = state.routes.findIndex((route: any) => route.name === tab.routeName);
                    const isFocused = activeRouteName === tab.routeName;

                    const onPress = () => {
                        const route = state.routes[routeIndex];
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route?.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(tab.routeName);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={tab.routeName}
                            style={[
                                tabStyles.tabItem,
                                {
                                    paddingHorizontal: compact ? 0 : 2,
                                    paddingVertical: compact ? 6 : 8,
                                },
                                isFocused && tabStyles.tabItemActive,
                            ]}
                            onPress={onPress}
                            activeOpacity={0.85}
                        >
                            <MaterialIcons
                                name={tab.icon}
                                size={compact ? 20 : 22}
                                color={isFocused ? '#006D44' : '#94a3b8'}
                            />
                            <Text
                                numberOfLines={1}
                                style={[
                                    tabStyles.tabLabel,
                                    {
                                        fontSize: compact ? 10 : 11,
                                    },
                                    isFocused && tabStyles.tabLabelActive,
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

const MainNavigator: React.FC = () => {
    const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [showExpenseModal, setShowExpenseModal] = React.useState(false);
    const [showJobModal, setShowJobModal] = React.useState(false);
    const [showJobLimitLocked, setShowJobLimitLocked] = React.useState(false);
    const [showEntryModal, setShowEntryModal] = React.useState(false);
    const [activeJobId, setActiveJobId] = React.useState<number | null>(null);
    const { user } = useAuthStore();
    const { jobs } = useJobsStore();

    const openPaywall = (
        source: RootStackParamList['Paywall']['source'],
        feature: RootStackParamList['Paywall']['feature'],
    ) => {
        rootNavigation.navigate('Paywall', { source, feature });
    };

    const openEntryModalFromNestedRoute = (activeTabRoute: any) => {
        const nestedState = activeTabRoute.state;
        if (!nestedState) {
            return false;
        }

        const innerRoute = nestedState.routes[nestedState.index];
        if (innerRoute.name === 'JobDetails' && innerRoute.params?.jobId) {
            const selectedJob = jobs.find((job) => job.id === innerRoute.params.jobId);
            if (selectedJob?.isLocked) {
                openPaywall('locked_job', 'jobs');
                return true;
            }

            setActiveJobId(innerRoute.params.jobId);
            setShowEntryModal(true);
            return true;
        }

        return false;
    };

    const handleAddPress = (tabState: any) => {
        const activeTabRoute = tabState.routes[tabState.index];
        const tabName = activeTabRoute.name;

        if (tabName === 'ExpensesTab') {
            if (!user?.access.canUseExpenses) {
                openPaywall('expenses', 'expenses');
                return;
            }

            setShowExpenseModal(true);
            return;
        }

        if (tabName === 'HomeTab' || tabName === 'OverviewTab') {
            if (openEntryModalFromNestedRoute(activeTabRoute)) {
                return;
            }

            if (!user?.subscription.isPremium && jobs.length >= 2) {
                setShowJobLimitLocked(true);
                return;
            }

            setShowJobModal(true);
            return;
        }

        setShowExpenseModal(true);
    };

    return (
        <>
            <Tab.Navigator
                tabBar={(props) => <CustomTabBar {...props} onAddPress={handleAddPress} />}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                }}
            >
                <Tab.Screen name="HomeTab" component={HomeNavigator} />
                <Tab.Screen name="GoalTab" component={user?.access.canUseGoals ? GoalNavigator : LockedGoalScreen} />
                <Tab.Screen name="ExpensesTab" component={user?.access.canUseExpenses ? ExpenseNavigator : LockedExpensesScreen} />
                <Tab.Screen name="AddTab" component={DummyScreen} />
                <Tab.Screen name="OverviewTab" component={OverviewNavigator} />
                <Tab.Screen name="ProfileTab" component={ProfileScreen} />
            </Tab.Navigator>

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
            <LockedFeatureModal
                visible={showJobLimitLocked}
                feature="jobs"
                onClose={() => setShowJobLimitLocked(false)}
                onUnlock={() => {
                    setShowJobLimitLocked(false);
                    openPaywall('job_limit', 'jobs');
                }}
            />
            {activeJobId ? (
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
            ) : null}
        </>
    );
};

export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth, user, shouldShowRegistrationSurvey } = useAuthStore();
    const { hasCompletedOnboarding, isOnboardingLoading, checkOnboardingStatus } = useOnboardingStore();
    const { bootstrap, clear, refreshSubscriptionStatus } = useSubscriptionStore();
    const { fetchDashboard, clearData: clearJobsData } = useJobsStore();
    const { fetchExpenses, fetchWeeklyGroups, clearData: clearExpenseData } = useExpenseStore();
    const lastBootstrapKey = React.useRef<string | null>(null);
    const lastBootstrapUserId = React.useRef<number | null>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        checkOnboardingStatus();
    }, [checkOnboardingStatus]);

    useEffect(() => {
        if (isAuthenticated && user) {
            bootstrap(user).catch(console.error);
            return;
        }

        clear().catch(console.error);
    }, [bootstrap, clear, isAuthenticated, user]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active' && isAuthenticated) {
                refreshSubscriptionStatus().catch(console.error);
            }
        });

        return () => subscription.remove();
    }, [isAuthenticated, refreshSubscriptionStatus]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            lastBootstrapKey.current = null;
            lastBootstrapUserId.current = null;
            clearJobsData();
            clearExpenseData();
            return;
        }

        const bootstrapKey = `${user.id}:${user.access.canUseExpenses}`;
        if (lastBootstrapKey.current === bootstrapKey) {
            return;
        }

        lastBootstrapKey.current = bootstrapKey;
        if (lastBootstrapUserId.current !== null && lastBootstrapUserId.current !== user.id) {
            clearJobsData();
            clearExpenseData();
        }
        lastBootstrapUserId.current = user.id;

        const tasks = [fetchDashboard()];
        if (user.access.canUseExpenses) {
            tasks.push(fetchExpenses(), fetchWeeklyGroups());
        }

        Promise.all(tasks).catch(console.error);
    }, [clearExpenseData, clearJobsData, fetchDashboard, fetchExpenses, fetchWeeklyGroups, isAuthenticated, user]);

    if (isLoading || isOnboardingLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {!hasCompletedOnboarding ? (
                    <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : isAuthenticated && shouldShowRegistrationSurvey && !user?.hasCompletedRegistrationSurvey ? (
                    <RootStack.Screen name="RegistrationSurvey" component={RegistrationSurveyScreen} />
                ) : isAuthenticated ? (
                    <>
                        <RootStack.Screen name="Main" component={MainNavigator} />
                        <RootStack.Screen name="Paywall" component={PaywallScreen} />
                    </>
                ) : (
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

const tabStyles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 112,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ff8a00',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        backgroundColor: 'rgba(255,255,255,0.80)',
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 40,
        elevation: 16,
    },
    tabItem: {
        flex: 1,
        minWidth: 0,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
        paddingVertical: 8,
        borderRadius: 18,
    },
    tabItemActive: {
        backgroundColor: 'rgba(0,109,68,0.05)',
    },
    tabLabel: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0,
        textTransform: 'none',
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: '100%',
    },
    tabLabelActive: {
        color: '#006D44',
    },
});

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
});
