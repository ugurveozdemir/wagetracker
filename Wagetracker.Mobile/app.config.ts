import type { ExpoConfig } from 'expo/config';

const iosBundleIdentifier = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.wagetracker.app';
const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.wagetracker.app';

const config: ExpoConfig = {
    name: 'WageTracker',
    slug: 'Wagetracker.Mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'wagetracker',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: iosBundleIdentifier,
    },
    android: {
        package: androidPackage,
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
    },
    web: {
        favicon: './assets/favicon.png',
    },
    plugins: [
        'expo-dev-client',
    ],
};

export default config;
