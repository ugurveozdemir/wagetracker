import { create } from 'zustand';
import {
    JobDetailsResponse,
    WeeklyGroupResponse,
    EntryResponse,
    CreateEntryRequest
} from '../types';
import { entriesApi } from '../api';

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

export const useEntriesStore = create<EntriesState>((set) => ({
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
