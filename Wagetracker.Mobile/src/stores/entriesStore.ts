import { create } from 'zustand';
import {
    EntryResponse,
    CreateEntryRequest,
} from '../types';
import { entriesApi } from '../api';
import { useJobsStore } from './jobsStore';

/**
 * entriesStore handles only *mutation* actions (create, delete).
 * Reading job details is intentionally kept local to JobDetailsScreen
 * to avoid a global singleton that conflicts when the same screen is
 * mounted more than once in the navigation stack.
 */
interface EntriesState {
    // UI state for mutations
    isCreating: boolean;
    isDeleting: boolean;
    error: string | null;
    lastCreatedEntry: EntryResponse | null;

    // Actions
    createEntry: (data: CreateEntryRequest) => Promise<EntryResponse>;
    deleteEntry: (id: number) => Promise<void>;
    clearError: () => void;
}

export const useEntriesStore = create<EntriesState>((set) => ({
    isCreating: false,
    isDeleting: false,
    error: null,
    lastCreatedEntry: null,

    createEntry: async (data: CreateEntryRequest) => {
        set({ isCreating: true, error: null });
        try {
            const newEntry = await entriesApi.create(data);
            // Kick off a background dashboard refresh so totals stay current
            useJobsStore.getState().fetchDashboard().catch(console.error);
            set({ isCreating: false, lastCreatedEntry: newEntry });
            return newEntry;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create entry',
                isCreating: false,
            });
            throw error;
        }
    },

    deleteEntry: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
            await entriesApi.delete(id);
            // Caller (JobDetailsScreen) is responsible for refreshing its own local state
            set({ isDeleting: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete entry',
                isDeleting: false,
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
