import { apiClient } from './client';
import { JobResponse, CreateJobRequest, UpdateJobRequest } from '../types';

export const jobsApi = {
    getAll: async (): Promise<JobResponse[]> => {
        const response = await apiClient.get<JobResponse[]>('/api/jobs');
        return response.data;
    },

    getById: async (id: number): Promise<JobResponse> => {
        const response = await apiClient.get<JobResponse>(`/api/jobs/${id}`);
        return response.data;
    },

    create: async (data: CreateJobRequest): Promise<JobResponse> => {
        const response = await apiClient.post<JobResponse>('/api/jobs', data);
        return response.data;
    },

    update: async (id: number, data: UpdateJobRequest): Promise<JobResponse> => {
        const response = await apiClient.put<JobResponse>(`/api/jobs/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/jobs/${id}`);
    },
};
