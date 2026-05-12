import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import config from '../config';
import { tokenStorage } from '../utils/storage';

// Get API base URL from centralized config
const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return config.API_URL_ANDROID;
    }
    return config.API_URL;
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
            const token = await tokenStorage.getItem(TOKEN_KEY);
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
    async (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            if (status === 401) {
                // Token expired or invalid — clear token and trigger logout
                try {
                    await tokenStorage.removeItem(TOKEN_KEY);
                    // Lazy import to avoid circular dependency
                    const { useAuthStore } = await import('../stores/authStore');
                    useAuthStore.getState().logout();
                } catch (logoutError) {
                    console.warn('Failed to auto-logout on 401:', logoutError);
                }
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

// Token management helpers (web: sessionStorage, native: SecureStore)
export const setAuthToken = async (token: string): Promise<void> => {
    await tokenStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return tokenStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
    await tokenStorage.removeItem(TOKEN_KEY);
};

export default apiClient;
