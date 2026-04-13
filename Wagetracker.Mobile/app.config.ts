import type { ExpoConfig } from 'expo/config';

const iosBundleIdentifier = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.wagetracker.app';
const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.wagetracker.app';

const config: ExpoConfig = {
    name: 'WageTracker',
    slug: 'wagetracker',
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
        'expo-image-manipulator',
        [
            'expo-image-picker',
            {
                photosPermission: 'Allow WageTracker to choose receipt photos for expense scanning.',
                cameraPermission: 'Allow WageTracker to take receipt photos for expense scanning.',
            },
        ],
    ],
    extra: {
        eas: {
            projectId: 'aeadbd90-11c5-4c4d-835b-687e4c4089d7',
        },
    },
};

export default config;
