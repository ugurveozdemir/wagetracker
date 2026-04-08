import { apiClient } from './client';
import { UpdateWeeklyGoalRequest, UserDto } from '../types';

export const profileApi = {
    updateWeeklyGoal: async (data: UpdateWeeklyGoalRequest): Promise<UserDto> => {
        const response = await apiClient.put<UserDto>('/api/profile/weekly-goal', data);
        return response.data;
    },
};
