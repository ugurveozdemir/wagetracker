import type { ExpoConfig } from 'expo/config';

const iosBundleIdentifier = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.chickaree.app';
const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.chickaree.app';

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
        buildNumber: process.env.EXPO_PUBLIC_IOS_BUILD_NUMBER || '1',
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
    },
    android: {
        package: androidPackage,
        versionCode: Number(process.env.EXPO_PUBLIC_ANDROID_VERSION_CODE || '1'),
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
            projectId: 'aeadbd90-11c5-4c4d-835b-687e4c4089d7',
        },
    },
};

export default config;
