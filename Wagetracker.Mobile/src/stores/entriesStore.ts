import { create } from 'zustand';
import {
    JobDetailsResponse,
    WeeklyGroupResponse,
    EntryResponse,
    CreateEntryRequest
} from '../types';
import { entriesApi } from '../api';
import { useJobsStore } from './jobsStore';

interface EntriesState {
    // Job details page data
    jobDetails: JobDetailsResponse | null;
    weeks: WeeklyGroupResponse[];

    // UI state
    isLoading: boolean;
    isCreating: boolean;
    isDeleting: boolean;
    error: string | null;

    // Actions
    fetchJobDetails: (jobId: number) => Promise<void>;
    createEntry: (data: CreateEntryRequest) => Promise<EntryResponse>;
    deleteEntry: (id: number) => Promise<void>;
    clearJobDetails: () => void;
    clearError: () => void;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
    jobDetails: null,
    weeks: [],
    isLoading: false,
    isCreating: false,
    isDeleting: false,
    error: null,

    fetchJobDetails: async (jobId: number) => {
        set({ isLoading: true, error: null });
        try {
            const details = await entriesApi.getJobDetailsWithWeekly(jobId);
            set({
                jobDetails: details,
                weeks: details.weeks,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load job details',
                isLoading: false
            });
        }
    },

    createEntry: async (data: CreateEntryRequest) => {
        set({ isCreating: true, error: null });
        try {
            const newEntry = await entriesApi.create(data);
            
            // Automatically refresh the job details to show the new entry immediately
            await get().fetchJobDetails(data.jobId);
            
            // Also refresh the dashboard so its total stats are up-to-date
            useJobsStore.getState().fetchDashboard().catch(console.error);

            set({ isCreating: false });
            return newEntry;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create entry',
                isCreating: false
            });
            throw error;
        }
    },

    deleteEntry: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
            await entriesApi.delete(id);

            // Using current job details id to refresh
             const currentJobId = get().jobDetails?.job.id;
             if (currentJobId) {
                 await get().fetchJobDetails(currentJobId);
                 useJobsStore.getState().fetchDashboard().catch(console.error);
             }

            set({ isDeleting: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete entry',
                isDeleting: false
            });
            throw error;
        }
    },

    clearJobDetails: () => set({ jobDetails: null, weeks: [] }),
    clearError: () => set({ error: null }),
}));
