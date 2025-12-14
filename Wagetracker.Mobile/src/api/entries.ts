import { apiClient } from './client';
import {
    EntryResponse,
    CreateEntryRequest,
    UpdateEntryRequest,
    JobDetailsResponse
} from '../types';

export const entriesApi = {
    getAll: async (): Promise<EntryResponse[]> => {
        const response = await apiClient.get<EntryResponse[]>('/api/entries');
        return response.data;
    },

    getById: async (id: number): Promise<EntryResponse> => {
        const response = await apiClient.get<EntryResponse>(`/api/entries/${id}`);
        return response.data;
    },

    getJobDetailsWithWeekly: async (jobId: number): Promise<JobDetailsResponse> => {
        const response = await apiClient.get<JobDetailsResponse>(`/api/entries/job/${jobId}/weekly`);
        return response.data;
    },

    create: async (data: CreateEntryRequest): Promise<EntryResponse> => {
        const response = await apiClient.post<EntryResponse>('/api/entries', data);
        return response.data;
    },

    update: async (id: number, data: UpdateEntryRequest): Promise<EntryResponse> => {
        const response = await apiClient.put<EntryResponse>(`/api/entries/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/entries/${id}`);
    },
};
