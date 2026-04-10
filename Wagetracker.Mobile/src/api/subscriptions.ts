import { apiClient } from './client';
import { UserDto } from '../types';

export const subscriptionsApi = {
    refresh: async (): Promise<UserDto> => {
        const response = await apiClient.post<UserDto>('/api/subscriptions/refresh');
        return response.data;
    },
};
