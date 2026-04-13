import { create } from 'zustand';
import {
    ConfirmReceiptScanExpenseRequest,
    ExpenseResponse,
    CreateExpenseRequest,
    ReceiptScanDraftResponse,
    WeeklyExpenseGroupResponse,
} from '../types';
import { expensesApi } from '../api/expenses';

interface ExpenseStore {
    expenses: ExpenseResponse[];
    weeklyGroups: WeeklyExpenseGroupResponse[];
    isLoading: boolean;
    isLoadingExpenses: boolean;
    isLoadingWeeklyGroups: boolean;
    hasLoadedExpenses: boolean;
    hasLoadedWeeklyGroups: boolean;
    error: string | null;

    fetchExpenses: (options?: { silent?: boolean }) => Promise<void>;
    fetchWeeklyGroups: (options?: { silent?: boolean }) => Promise<void>;
    createExpense: (data: CreateExpenseRequest) => Promise<void>;
    scanReceipt: (image: { uri: string; name: string; type: string }) => Promise<ReceiptScanDraftResponse>;
    confirmReceiptScan: (data: ConfirmReceiptScanExpenseRequest) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
    clearData: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
    expenses: [],
    weeklyGroups: [],
    isLoading: false,
    isLoadingExpenses: false,
    isLoadingWeeklyGroups: false,
    hasLoadedExpenses: false,
    hasLoadedWeeklyGroups: false,
    error: null,

    fetchExpenses: async (options) => {
        if (!options?.silent) {
            set({ isLoading: true, isLoadingExpenses: true, error: null });
        } else {
            set({ error: null });
        }

        try {
            const expenses = await expensesApi.getAll();
            set((state) => ({
                expenses,
                hasLoadedExpenses: true,
                isLoadingExpenses: false,
                isLoading: state.isLoadingWeeklyGroups,
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expenses';
            set((state) => ({
                error: message,
                isLoadingExpenses: false,
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
            const weeklyGroups = await expensesApi.getWeekly();
            set((state) => ({
                weeklyGroups,
                hasLoadedWeeklyGroups: true,
                isLoadingWeeklyGroups: false,
                isLoading: state.isLoadingExpenses,
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expense history';
            set((state) => ({
                error: message,
                isLoadingWeeklyGroups: false,
                isLoading: state.isLoadingExpenses,
            }));
        }
    },

    createExpense: async (data: CreateExpenseRequest) => {
        try {
            await expensesApi.create(data);
            // Refresh list after creation
            await get().fetchExpenses();
            await get().fetchWeeklyGroups();
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
            await get().fetchExpenses();
            await get().fetchWeeklyGroups();
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to save scanned expense';
            throw new Error(message);
        }
    },

    deleteExpense: async (id: number) => {
        try {
            await expensesApi.delete(id);
            // Optimistic update: remove from local state
            set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id),
                weeklyGroups: state.weeklyGroups
                    .map((group) => ({
                        ...group,
                        totalAmount: group.expenses
                            .filter((expense) => expense.id !== id)
                            .reduce((sum, expense) => sum + expense.amount, 0),
                        expenses: group.expenses.filter((expense) => expense.id !== id),
                    }))
                    .filter((group) => group.expenses.length > 0),
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete expense';
            throw new Error(message);
        }
    },

    clearData: () => set({
        expenses: [],
        weeklyGroups: [],
        isLoading: false,
        isLoadingExpenses: false,
        isLoadingWeeklyGroups: false,
        hasLoadedExpenses: false,
        hasLoadedWeeklyGroups: false,
        error: null,
    }),
}));
