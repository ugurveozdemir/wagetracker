import { create } from 'zustand';
import { ExpenseResponse, CreateExpenseRequest } from '../types';
import { expensesApi } from '../api/expenses';

interface ExpenseStore {
    expenses: ExpenseResponse[];
    isLoading: boolean;
    error: string | null;

    fetchExpenses: () => Promise<void>;
    createExpense: (data: CreateExpenseRequest) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
    expenses: [],
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

    createExpense: async (data: CreateExpenseRequest) => {
        try {
            await expensesApi.create(data);
            // Refresh list after creation
            await get().fetchExpenses();
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to create expense';
            throw new Error(message);
        }
    },

    deleteExpense: async (id: number) => {
        try {
            await expensesApi.delete(id);
            // Optimistic update: remove from local state
            set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id),
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete expense';
            throw new Error(message);
        }
    },
}));
