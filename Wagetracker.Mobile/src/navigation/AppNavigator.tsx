import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import {
    RootStackParamList,
    AuthStackParamList,
    HomeStackParamList,
    TabParamList,
} from '../types';
import { useAuthStore } from '../stores';
import { colors, spacing, fontWeights } from '../theme';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddEntryModal } from '../components/AddEntryModal';
import { CreateJobModal } from '../components/CreateJobModal';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
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
            <HomeStack.Screen name="JobDetails" component={JobDetailsScreen} />
        </HomeStack.Navigator>
    );
};

const DummyScreen: React.FC = () => <View />;

const CustomTabBar: React.FC<any> = ({ state, navigation, onAddPress }) => {
    const tabs = [
        { name: 'HomeTab', icon: 'home', label: 'Dashboard' },
        { name: 'ExpensesTab', icon: 'credit-card', label: 'Expenses' },
        { name: 'AddTab', icon: 'plus', label: 'Add', isCenter: true },
        { name: 'OverviewTab', icon: 'bar-chart-2', label: 'Overview' },
        { name: 'ProfileTab', icon: 'user', label: 'Profile' },
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

                    if (tab.isCenter) {
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                style={tabStyles.centerButton}
                                onPress={onPress}
                                activeOpacity={0.85}
                            >
                                <View style={tabStyles.centerButtonInner}>
                                    <Feather name="plus" size={24} color={colors.white} />
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={tabStyles.tab}
                            onPress={onPress}
                            activeOpacity={0.78}
                        >
                            <View
                                style={[
                                    tabStyles.iconWrap,
                                    isFocused && tabStyles.iconWrapActive,
                                ]}
                            >
                                <Feather
                                    name={tab.icon}
                                    size={18}
                                    color={isFocused ? colors.primary : colors.slate400}
                                />
                            </View>
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

const MainNavigator: React.FC = () => {
    const [showExpenseModal, setShowExpenseModal] = React.useState(false);
    const [showJobModal, setShowJobModal] = React.useState(false);
    const [showEntryModal, setShowEntryModal] = React.useState(false);
    const [activeJobId, setActiveJobId] = React.useState<number | null>(null);

    const handleAddPress = (tabState: any) => {
        const activeTabRoute = tabState.routes[tabState.index];
        const tabName = activeTabRoute.name;

        if (tabName === 'ExpensesTab') {
            setShowExpenseModal(true);
        } else if (tabName === 'HomeTab') {
            const nestedState = activeTabRoute.state;
            if (nestedState) {
                const innerRoute = nestedState.routes[nestedState.index];
                if (innerRoute.name === 'JobDetails' && innerRoute.params?.jobId) {
                    setActiveJobId(innerRoute.params.jobId);
                    setShowEntryModal(true);
                    return;
                }
            }
            setShowJobModal(true);
        } else {
            setShowExpenseModal(true);
        }
    };

    return (
        <>
            <Tab.Navigator
                tabBar={(props) => <CustomTabBar {...props} onAddPress={handleAddPress} />}
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

export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

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

const tabStyles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingHorizontal: spacing.md,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.82)',
        borderRadius: 48,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    iconWrapActive: {
        backgroundColor: 'rgba(0, 109, 68, 0.08)',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: fontWeights.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
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
        marginTop: -18,
    },
    centerButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.secondaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 12,
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
