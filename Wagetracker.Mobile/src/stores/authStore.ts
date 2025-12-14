import { create } from 'zustand';
import { UserDto } from '../types';
import { authApi } from '../api';
import { getAuthToken, removeAuthToken } from '../api/client';

interface AuthState {
    user: UserDto | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading to check existing token
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.login({ email, password });
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register({ email, password, fullName });
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        await removeAuthToken();
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const token = await getAuthToken();
            if (token) {
                // For development, we'll skip token validation
                // In production, you'd want to validate the token with the server
                set({ isAuthenticated: true, isLoading: false });
            } else {
                set({ isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            set({ isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
