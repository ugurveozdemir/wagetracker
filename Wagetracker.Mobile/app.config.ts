import type { ExpoConfig } from 'expo/config';

const DEFAULT_IOS_BUNDLE_ID = 'com.ugurozdemir.chickareej1';
const DEFAULT_ANDROID_PACKAGE = 'com.ugurozdemir.chickareej1';

const iosBundleIdentifier = process.env.IOS_BUNDLE_ID || DEFAULT_IOS_BUNDLE_ID;
const androidPackage = process.env.ANDROID_PACKAGE || DEFAULT_ANDROID_PACKAGE;

const config: ExpoConfig = {
    name: 'Chickaree',
    slug: 'chickaree',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'chickaree',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    ios: {
        supportsTablet: false,
        bundleIdentifier: iosBundleIdentifier,
        buildNumber: process.env.IOS_BUILD_NUMBER || '1',
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
    },
    android: {
        package: androidPackage,
        versionCode: Number(process.env.ANDROID_VERSION_CODE || '1'),
        permissions: ['com.android.vending.BILLING'],
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
        [
            'expo-image-picker',
            {
                photosPermission: 'Allow Chickaree to choose receipt photos for expense scanning.',
                cameraPermission: 'Allow Chickaree to take receipt photos for expense scanning.',
            },
        ],
    ],
    extra: {
        eas: {
            projectId: '825dcad9-fbfd-487e-9c9b-658a68f96bc9',
        },
    },
};

export default config;
