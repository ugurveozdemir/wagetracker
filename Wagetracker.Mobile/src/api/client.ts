import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to access host machine's localhost
// iOS simulator uses localhost directly
const getBaseUrl = () => {
    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:5098'; // Android emulator
        }
        return 'http://localhost:5098'; // iOS simulator & Web
    }
    // Production URL - update this when deploying
    return 'https://your-production-api.com';
};

const TOKEN_KEY = 'auth_token';

// Web-compatible storage helpers (SecureStore doesn't work on web)
const isWeb = Platform.OS === 'web';

const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (isWeb) {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (isWeb) {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (isWeb) {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

export const apiClient: AxiosInstance = axios.create({
    baseURL: getBaseUrl(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await storage.getItem(TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to get token from storage:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            if (status === 401) {
                // Token expired or invalid - could trigger logout here
                console.warn('Unauthorized - token may be expired');
            }

            // Return a more useful error message
            const message = data?.message || data?.title || 'An error occurred';
            return Promise.reject(new Error(message));
        } else if (error.request) {
            // Network error
            return Promise.reject(new Error('Network error - please check your connection'));
        }
        return Promise.reject(error);
    }
);

// Token management helpers (using web-compatible storage)
export const setAuthToken = async (token: string): Promise<void> => {
    await storage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
    await storage.removeItem(TOKEN_KEY);
};

export default apiClient;

