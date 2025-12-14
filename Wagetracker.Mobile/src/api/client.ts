import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to access host machine's localhost
// iOS simulator uses localhost directly
const getBaseUrl = () => {
    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:5000'; // Android emulator
        }
        return 'http://localhost:5000'; // iOS simulator
    }
    // Production URL - update this when deploying
    return 'https://your-production-api.com';
};

const TOKEN_KEY = 'auth_token';

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
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to get token from secure store:', error);
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

// Token management helpers
export const setAuthToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export default apiClient;
