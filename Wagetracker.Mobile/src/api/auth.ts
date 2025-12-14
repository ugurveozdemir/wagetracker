import { apiClient, setAuthToken, removeAuthToken } from './client';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

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

    logout: async (): Promise<void> => {
        await removeAuthToken();
    },
};
