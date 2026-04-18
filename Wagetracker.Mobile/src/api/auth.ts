import { apiClient, setAuthToken, removeAuthToken } from './client';
import { LoginRequest, RegisterRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types';
import { profileApi } from './profile';

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
        await setAuthToken(response.data.token);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
        await setAuthToken(response.data.token);
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
        return response.data;
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', data);
        return response.data;
    },

    getCurrentUser: async () => {
        return await profileApi.getMe();
    },

    logout: async (): Promise<void> => {
        await removeAuthToken();
    },

    deleteAccount: async (): Promise<void> => {
        await profileApi.deleteAccount();
        await removeAuthToken();
    },
};
