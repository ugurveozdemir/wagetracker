import { apiClient } from './client';
import {
    ConfirmReceiptScanExpenseRequest,
    ExpenseResponse,
    ExpenseSummaryResponse,
    CreateExpenseRequest,
    PagedWeeklyExpenseGroupsResponse,
    ReceiptScanDraftResponse,
    UpdateExpenseRequest,
    WeeklyExpenseGroupResponse,
} from '../types';

export const expensesApi = {
    getWeekly: async (): Promise<WeeklyExpenseGroupResponse[]> => {
        const response = await apiClient.get<WeeklyExpenseGroupResponse[]>('/api/expenses/weekly');
        return response.data;
    },

    getWeeklyPage: async (params?: { beforeWeekStart?: string | null; take?: number }): Promise<PagedWeeklyExpenseGroupsResponse> => {
        const response = await apiClient.get<PagedWeeklyExpenseGroupsResponse>('/api/expenses/weekly-page', { params });
        return response.data;
    },

    getSummary: async (): Promise<ExpenseSummaryResponse> => {
        const response = await apiClient.get<ExpenseSummaryResponse>('/api/expenses/summary');
        return response.data;
    },

    getById: async (id: number): Promise<ExpenseResponse> => {
        const response = await apiClient.get<ExpenseResponse>(`/api/expenses/${id}`);
        return response.data;
    },

    create: async (data: CreateExpenseRequest): Promise<ExpenseResponse> => {
        const response = await apiClient.post<ExpenseResponse>('/api/expenses', data);
        return response.data;
    },

    scanReceipt: async (image: { uri: string; name: string; type: string }): Promise<ReceiptScanDraftResponse> => {
        const formData = new FormData();
        formData.append('receiptImage', image as any);

        const response = await apiClient.post<ReceiptScanDraftResponse>('/api/expenses/receipt-scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    confirmReceiptScan: async (data: ConfirmReceiptScanExpenseRequest): Promise<ExpenseResponse> => {
        const response = await apiClient.post<ExpenseResponse>('/api/expenses/receipt-scan/confirm', data);
        return response.data;
    },

    update: async (id: number, data: UpdateExpenseRequest): Promise<ExpenseResponse> => {
        const response = await apiClient.put<ExpenseResponse>(`/api/expenses/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/expenses/${id}`);
    },
};
