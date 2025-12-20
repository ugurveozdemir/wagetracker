/**
 * Application configuration
 * Environment variables are loaded from .env files via Expo
 */

const ENV = {
    development: {
        API_URL: 'http://localhost:5098',
        API_URL_ANDROID: 'http://10.0.2.2:5098',
    },
    production: {
        API_URL: 'https://api.wagetracker.xyz',
        API_URL_ANDROID: 'https://api.wagetracker.xyz',
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
        };
    }

    // Default based on dev/prod mode
    return __DEV__ ? ENV.development : ENV.production;
};

export const config = getEnvConfig();

export default config;
