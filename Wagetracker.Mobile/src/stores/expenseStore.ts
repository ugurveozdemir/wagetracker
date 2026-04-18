import { create } from 'zustand';
import {
    ConfirmReceiptScanExpenseRequest,
    ExpenseSummaryResponse,
    CreateExpenseRequest,
    ReceiptScanDraftResponse,
    WeeklyExpenseGroupResponse,
} from '../types';
import { expensesApi } from '../api/expenses';

const WEEKLY_HISTORY_PAGE_SIZE = 8;

interface ExpenseStore {
    summary: ExpenseSummaryResponse | null;
    weeklyGroups: WeeklyExpenseGroupResponse[];
    weeklyGroupsNextCursor: string | null;
    hasMoreWeeklyGroups: boolean;
    isLoading: boolean;
    isLoadingSummary: boolean;
    isLoadingWeeklyGroups: boolean;
    isLoadingMoreWeeklyGroups: boolean;
    hasLoadedSummary: boolean;
    hasLoadedWeeklyGroups: boolean;
    error: string | null;

    fetchSummary: (options?: { silent?: boolean }) => Promise<void>;
    fetchWeeklyGroups: (options?: { silent?: boolean }) => Promise<void>;
    loadMoreWeeklyGroups: () => Promise<void>;
    createExpense: (data: CreateExpenseRequest) => Promise<void>;
    scanReceipt: (image: { uri: string; name: string; type: string }) => Promise<ReceiptScanDraftResponse>;
    confirmReceiptScan: (data: ConfirmReceiptScanExpenseRequest) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
    clearData: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
    summary: null,
    weeklyGroups: [],
    weeklyGroupsNextCursor: null,
    hasMoreWeeklyGroups: false,
    isLoading: false,
    isLoadingSummary: false,
    isLoadingWeeklyGroups: false,
    isLoadingMoreWeeklyGroups: false,
    hasLoadedSummary: false,
    hasLoadedWeeklyGroups: false,
    error: null,

    fetchSummary: async (options) => {
        if (!options?.silent) {
            set({ isLoading: true, isLoadingSummary: true, error: null });
        } else {
            set({ error: null });
        }

        try {
            const summary = await expensesApi.getSummary();
            set((state) => ({
                summary,
                hasLoadedSummary: true,
                isLoadingSummary: false,
                isLoading: state.isLoadingWeeklyGroups,
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expense summary';
            set((state) => ({
                error: message,
                isLoadingSummary: false,
                isLoading: state.isLoadingWeeklyGroups,
            }));
        }
    },

    fetchWeeklyGroups: async (options) => {
        if (!options?.silent) {
            set({ isLoading: true, isLoadingWeeklyGroups: true, error: null });
        } else {
            set({ error: null });
        }

        try {
            const page = await expensesApi.getWeeklyPage({ take: WEEKLY_HISTORY_PAGE_SIZE });
            set((state) => ({
                weeklyGroups: page.groups,
                weeklyGroupsNextCursor: page.nextCursor,
                hasMoreWeeklyGroups: page.hasMore,
                hasLoadedWeeklyGroups: true,
                isLoadingWeeklyGroups: false,
                isLoading: state.isLoadingSummary,
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expense history';
            set((state) => ({
                error: message,
                isLoadingWeeklyGroups: false,
                isLoading: state.isLoadingSummary,
            }));
        }
    },

    loadMoreWeeklyGroups: async () => {
        const { hasMoreWeeklyGroups, isLoadingMoreWeeklyGroups, isLoadingWeeklyGroups, weeklyGroupsNextCursor } = get();
        if (!hasMoreWeeklyGroups || isLoadingMoreWeeklyGroups || isLoadingWeeklyGroups || !weeklyGroupsNextCursor) {
            return;
        }

        set({ isLoadingMoreWeeklyGroups: true, error: null });

        try {
            const page = await expensesApi.getWeeklyPage({
                beforeWeekStart: weeklyGroupsNextCursor,
                take: WEEKLY_HISTORY_PAGE_SIZE,
            });

            set((state) => ({
                weeklyGroups: [...state.weeklyGroups, ...page.groups],
                weeklyGroupsNextCursor: page.nextCursor,
                hasMoreWeeklyGroups: page.hasMore,
                isLoadingMoreWeeklyGroups: false,
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to load more expense history';
            set({
                error: message,
                isLoadingMoreWeeklyGroups: false,
            });
        }
    },

    createExpense: async (data: CreateExpenseRequest) => {
        try {
            await expensesApi.create(data);
            await Promise.all([
                get().fetchSummary(),
                get().fetchWeeklyGroups(),
            ]);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to create expense';
            throw new Error(message);
        }
    },

    scanReceipt: async (image) => {
        try {
            return await expensesApi.scanReceipt(image);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to scan receipt';
            throw new Error(message);
        }
    },

    confirmReceiptScan: async (data: ConfirmReceiptScanExpenseRequest) => {
        try {
            await expensesApi.confirmReceiptScan(data);
            await Promise.all([
                get().fetchSummary(),
                get().fetchWeeklyGroups(),
            ]);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to save scanned expense';
            throw new Error(message);
        }
    },

    deleteExpense: async (id: number) => {
        try {
            await expensesApi.delete(id);
            await Promise.all([
                get().fetchSummary({ silent: true }),
                get().fetchWeeklyGroups({ silent: true }),
            ]);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete expense';
            throw new Error(message);
        }
    },

    clearData: () => set({
        summary: null,
        weeklyGroups: [],
        weeklyGroupsNextCursor: null,
        hasMoreWeeklyGroups: false,
        isLoading: false,
        isLoadingSummary: false,
        isLoadingWeeklyGroups: false,
        isLoadingMoreWeeklyGroups: false,
        hasLoadedSummary: false,
        hasLoadedWeeklyGroups: false,
        error: null,
    }),
}));
