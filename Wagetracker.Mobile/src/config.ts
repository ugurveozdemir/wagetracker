/**
 * Application configuration
 * Client/runtime values come from EXPO_PUBLIC_* variables.
 * Local development can mirror them in Wagetracker.Mobile/.env.
 */

type AppConfig = {
    API_URL: string;
    API_URL_ANDROID: string;
    REVENUECAT_IOS_API_KEY: string;
    REVENUECAT_ANDROID_API_KEY: string;
    REVENUECAT_ENTITLEMENT_ID: string;
    TERMS_URL: string;
    PRIVACY_URL: string;
    SUPPORT_EMAIL: string;
    ACCOUNT_DELETION_URL: string;
    APP_STORE_SUBSCRIPTIONS_URL: string;
    PLAY_STORE_SUBSCRIPTIONS_URL: string;
};

const requiredEnv = (name: string, value: string | undefined) => {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

export const config: AppConfig = {
    API_URL: requiredEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
    API_URL_ANDROID: process.env.EXPO_PUBLIC_API_URL_ANDROID || requiredEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
    REVENUECAT_IOS_API_KEY: requiredEnv(
        'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
        process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    ),
    REVENUECAT_ANDROID_API_KEY: requiredEnv(
        'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
        process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
    ),
    REVENUECAT_ENTITLEMENT_ID: requiredEnv(
        'EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID',
        process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID
    ),
    TERMS_URL: requiredEnv('EXPO_PUBLIC_TERMS_URL', process.env.EXPO_PUBLIC_TERMS_URL),
    PRIVACY_URL: requiredEnv('EXPO_PUBLIC_PRIVACY_URL', process.env.EXPO_PUBLIC_PRIVACY_URL),
    SUPPORT_EMAIL: requiredEnv('EXPO_PUBLIC_SUPPORT_EMAIL', process.env.EXPO_PUBLIC_SUPPORT_EMAIL),
    ACCOUNT_DELETION_URL: requiredEnv(
        'EXPO_PUBLIC_ACCOUNT_DELETION_URL',
        process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL
    ),
    APP_STORE_SUBSCRIPTIONS_URL: requiredEnv(
        'EXPO_PUBLIC_APP_STORE_SUBSCRIPTIONS_URL',
        process.env.EXPO_PUBLIC_APP_STORE_SUBSCRIPTIONS_URL
    ),
    PLAY_STORE_SUBSCRIPTIONS_URL: requiredEnv(
        'EXPO_PUBLIC_PLAY_STORE_SUBSCRIPTIONS_URL',
        process.env.EXPO_PUBLIC_PLAY_STORE_SUBSCRIPTIONS_URL
    ),
};

export default config;
