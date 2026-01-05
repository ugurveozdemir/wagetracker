import { create } from 'zustand';
import { JobResponse, DashboardSummaryResponse, CreateJobRequest, UpdateJobRequest } from '../types';
import { dashboardApi, jobsApi } from '../api';

interface JobsState {
    // Dashboard data
    summary: DashboardSummaryResponse | null;
    jobs: JobResponse[];

    // UI state
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    error: string | null;

    // Actions
    fetchDashboard: () => Promise<void>;
    fetchJobs: () => Promise<void>;
    createJob: (data: CreateJobRequest) => Promise<JobResponse>;
    updateJob: (id: number, data: UpdateJobRequest) => Promise<JobResponse>;
    deleteJob: (id: number) => Promise<void>;
    clearError: () => void;
}

export const useJobsStore = create<JobsState>((set, get) => ({
    summary: null,
    jobs: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    error: null,

    fetchDashboard: async () => {
        set({ isLoading: true, error: null });
        try {
            const summary = await dashboardApi.getSummary();
            set({
                summary,
                jobs: summary.jobs,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load dashboard',
                isLoading: false
            });
        }
    },

    fetchJobs: async () => {
        set({ isLoading: true, error: null });
        try {
            const jobs = await jobsApi.getAll();
            set({ jobs, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load jobs',
                isLoading: false
            });
        }
    },

    createJob: async (data: CreateJobRequest) => {
        set({ isCreating: true, error: null });
        try {
            const newJob = await jobsApi.create(data);
            set((state) => ({
                jobs: [newJob, ...state.jobs],
                isCreating: false
            }));
            return newJob;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create job',
                isCreating: false
            });
            throw error;
        }
    },

    updateJob: async (id: number, data: UpdateJobRequest) => {
        set({ isUpdating: true, error: null });
        try {
            const updatedJob = await jobsApi.update(id, data);
            set((state) => ({
                jobs: state.jobs.map(job => job.id === id ? updatedJob : job),
                isUpdating: false
            }));
            return updatedJob;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update job',
                isUpdating: false
            });
            throw error;
        }
    },

    deleteJob: async (id: number) => {
        try {
            await jobsApi.delete(id);
            set((state) => ({
                jobs: state.jobs.filter(job => job.id !== id)
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete job'
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

