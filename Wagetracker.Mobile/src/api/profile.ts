import { apiClient } from './client';
import { UpdateWeeklyGoalRequest, UserDto } from '../types';

export const profileApi = {
    getMe: async (): Promise<UserDto> => {
        const response = await apiClient.get<UserDto>('/api/profile/me');
        return response.data;
    },

    updateWeeklyGoal: async (data: UpdateWeeklyGoalRequest): Promise<UserDto> => {
        const response = await apiClient.put<UserDto>('/api/profile/weekly-goal', data);
        return response.data;
    },

    deleteAccount: async (): Promise<void> => {
        await apiClient.delete('/api/profile/account');
    },
};
