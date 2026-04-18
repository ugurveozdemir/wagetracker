import { create } from 'zustand';
import { JobResponse, DashboardSummaryResponse, CreateJobRequest, UpdateJobRequest } from '../types';
import { dashboardApi, jobsApi } from '../api';

const sortJobsByCreation = (jobs: JobResponse[]) =>
    [...jobs].sort((a, b) => {
        const createdAtDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return createdAtDifference || a.id - b.id;
    });

interface JobsState {
    // Dashboard data
    summary: DashboardSummaryResponse | null;
    jobs: JobResponse[];

    // UI state
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    hasLoadedDashboard: boolean;
    error: string | null;

    // Actions
    fetchDashboard: (options?: { silent?: boolean }) => Promise<void>;
    fetchJobs: (options?: { silent?: boolean }) => Promise<void>;
    createJob: (data: CreateJobRequest) => Promise<JobResponse>;
    updateJob: (id: number, data: UpdateJobRequest) => Promise<JobResponse>;
    deleteJob: (id: number) => Promise<void>;
    clearError: () => void;
    clearData: () => void;
}

export const useJobsStore = create<JobsState>((set, get) => ({
    summary: null,
    jobs: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    hasLoadedDashboard: false,
    error: null,

    fetchDashboard: async (options) => {
        if (!options?.silent) {
            set({ isLoading: true, error: null });
        } else {
            set({ error: null });
        }

        try {
            const summary = await dashboardApi.getSummary();
            const sortedJobs = sortJobsByCreation(summary.jobs);
            set({
                summary: {
                    ...summary,
                    jobs: sortedJobs,
                },
                jobs: sortedJobs,
                hasLoadedDashboard: true,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load dashboard',
                isLoading: false
            });
        }
    },

    fetchJobs: async (options) => {
        if (!options?.silent) {
            set({ isLoading: true, error: null });
        } else {
            set({ error: null });
        }

        try {
            const jobs = await jobsApi.getAll();
            set({ jobs: sortJobsByCreation(jobs), isLoading: false });
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
                jobs: sortJobsByCreation([...state.jobs, newJob]),
                summary: state.summary
                    ? {
                        ...state.summary,
                        activeJobsCount: state.summary.activeJobsCount + 1,
                        jobs: sortJobsByCreation([...state.summary.jobs, newJob]),
                    }
                    : state.summary,
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
                summary: state.summary
                    ? {
                        ...state.summary,
                        jobs: state.summary.jobs.map(job => job.id === id ? updatedJob : job),
                    }
                    : state.summary,
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
                jobs: state.jobs.filter(job => job.id !== id),
                summary: state.summary
                    ? {
                        ...state.summary,
                        activeJobsCount: Math.max(0, state.summary.activeJobsCount - 1),
                        jobs: state.summary.jobs.filter(job => job.id !== id),
                    }
                    : state.summary,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete job'
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
    clearData: () => set({
        summary: null,
        jobs: [],
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        hasLoadedDashboard: false,
        error: null,
    }),
}));
