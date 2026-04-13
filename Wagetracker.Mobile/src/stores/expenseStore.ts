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
    error: string | null;

    fetchExpenses: () => Promise<void>;
    fetchWeeklyGroups: () => Promise<void>;
    createExpense: (data: CreateExpenseRequest) => Promise<void>;
    scanReceipt: (image: { uri: string; name: string; type: string }) => Promise<ReceiptScanDraftResponse>;
    confirmReceiptScan: (data: ConfirmReceiptScanExpenseRequest) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
    expenses: [],
    weeklyGroups: [],
    isLoading: false,
    error: null,

    fetchExpenses: async () => {
        set({ isLoading: true, error: null });
        try {
            const expenses = await expensesApi.getAll();
            set({ expenses, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expenses';
            set({ error: message, isLoading: false });
        }
    },

    fetchWeeklyGroups: async () => {
        set({ isLoading: true, error: null });
        try {
            const weeklyGroups = await expensesApi.getWeekly();
            set({ weeklyGroups, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch expense history';
            set({ error: message, isLoading: false });
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
}));
