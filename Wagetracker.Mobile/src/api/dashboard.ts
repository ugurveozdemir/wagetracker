import { apiClient } from './client';
import { DashboardSummaryResponse } from '../types';

export const dashboardApi = {
    getSummary: async (): Promise<DashboardSummaryResponse> => {
        const response = await apiClient.get<DashboardSummaryResponse>('/api/dashboard/summary');
        return response.data;
    },
};
