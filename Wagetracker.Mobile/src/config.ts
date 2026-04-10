/**
 * Application configuration
 * Environment variables are loaded from .env files via Expo
 */

const ENV = {
    development: {
        API_URL: 'http://localhost:5098',
        API_URL_ANDROID: 'http://10.0.2.2:5098',
        IOS_BUNDLE_ID: 'com.wagetracker.app',
        ANDROID_PACKAGE: 'com.wagetracker.app',
        REVENUECAT_IOS_API_KEY: '',
        REVENUECAT_ANDROID_API_KEY: '',
        TERMS_URL: 'https://wagetracker.xyz/terms',
        PRIVACY_URL: 'https://wagetracker.xyz/privacy',
        APP_STORE_SUBSCRIPTIONS_URL: 'https://apps.apple.com/account/subscriptions',
        PLAY_STORE_SUBSCRIPTIONS_URL: 'https://play.google.com/store/account/subscriptions',
    },
    production: {
        API_URL: 'https://api.wagetracker.xyz',
        API_URL_ANDROID: 'https://api.wagetracker.xyz',
        IOS_BUNDLE_ID: 'com.wagetracker.app',
        ANDROID_PACKAGE: 'com.wagetracker.app',
        REVENUECAT_IOS_API_KEY: '',
        REVENUECAT_ANDROID_API_KEY: '',
        TERMS_URL: 'https://wagetracker.xyz/terms',
        PRIVACY_URL: 'https://wagetracker.xyz/privacy',
        APP_STORE_SUBSCRIPTIONS_URL: 'https://apps.apple.com/account/subscriptions',
        PLAY_STORE_SUBSCRIPTIONS_URL: 'https://play.google.com/store/account/subscriptions',
    },
};

// Use EXPO_PUBLIC_API_URL if set, otherwise use defaults based on __DEV__
const getEnvConfig = () => {
    // Allow override via environment variable
    const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envApiUrl) {
        return {
            API_URL: envApiUrl,
            API_URL_ANDROID: envApiUrl,
            IOS_BUNDLE_ID: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || ENV.production.IOS_BUNDLE_ID,
            ANDROID_PACKAGE: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || ENV.production.ANDROID_PACKAGE,
            REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
            REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
            TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL || ENV.production.TERMS_URL,
            PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL || ENV.production.PRIVACY_URL,
            APP_STORE_SUBSCRIPTIONS_URL:
                process.env.EXPO_PUBLIC_APP_STORE_SUBSCRIPTIONS_URL || ENV.production.APP_STORE_SUBSCRIPTIONS_URL,
            PLAY_STORE_SUBSCRIPTIONS_URL:
                process.env.EXPO_PUBLIC_PLAY_STORE_SUBSCRIPTIONS_URL || ENV.production.PLAY_STORE_SUBSCRIPTIONS_URL,
        };
    }

    // Default based on dev/prod mode
    const defaults = __DEV__ ? ENV.development : ENV.production;
    return {
        ...defaults,
        IOS_BUNDLE_ID: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || defaults.IOS_BUNDLE_ID,
        ANDROID_PACKAGE: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || defaults.ANDROID_PACKAGE,
        REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || defaults.REVENUECAT_IOS_API_KEY,
        REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || defaults.REVENUECAT_ANDROID_API_KEY,
        TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL || defaults.TERMS_URL,
        PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL || defaults.PRIVACY_URL,
        APP_STORE_SUBSCRIPTIONS_URL:
            process.env.EXPO_PUBLIC_APP_STORE_SUBSCRIPTIONS_URL || defaults.APP_STORE_SUBSCRIPTIONS_URL,
        PLAY_STORE_SUBSCRIPTIONS_URL:
            process.env.EXPO_PUBLIC_PLAY_STORE_SUBSCRIPTIONS_URL || defaults.PLAY_STORE_SUBSCRIPTIONS_URL,
    };
};

export const config = getEnvConfig();

export default config;
