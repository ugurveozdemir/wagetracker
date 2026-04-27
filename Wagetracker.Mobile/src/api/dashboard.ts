import { apiClient } from './client';
import { DashboardSummaryResponse, GeneralSummaryResponse } from '../types';

export const dashboardApi = {
    getSummary: async (): Promise<DashboardSummaryResponse> => {
        const response = await apiClient.get<DashboardSummaryResponse>('/api/dashboard/summary');
        return response.data;
    },

    getGeneralSummary: async (): Promise<GeneralSummaryResponse> => {
        const response = await apiClient.get<GeneralSummaryResponse>('/api/dashboard/general-summary');
        return response.data;
    },
};
