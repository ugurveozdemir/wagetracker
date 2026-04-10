// ==================== AUTH TYPES ====================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface AuthResponse {
    token: string;
    user: UserDto;
}

export interface SubscriptionSummary {
    isPremium: boolean;
    status: string;
    productId: string | null;
    planTerm: string;
    store: string;
    expiresAt: string | null;
    willRenew: boolean;
    lastSyncedAt: string;
}

export interface FeatureAccess {
    maxUnlockedJobs: number;
    unlockedJobCount: number;
    canUseGoals: boolean;
    canUseExpenses: boolean;
    hasLockedJobs: boolean;
}

export interface UserDto {
    id: number;
    email: string;
    fullName: string;
    weeklyGoalAmount?: number | null;
    billingCustomerId: string;
    subscription: SubscriptionSummary;
    access: FeatureAccess;
}

export interface UpdateWeeklyGoalRequest {
    targetAmount: number | null;
}

// ==================== JOB TYPES ====================

export interface JobResponse {
    id: number;
    title: string;
    hourlyRate: number;
    firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    totalEarnings: number;
    totalHours: number;
    isLocked: boolean;
    lockedReason: string | null;
    createdAt: string;
}

export interface CreateJobRequest {
    title: string;
    hourlyRate: number;
    firstDayOfWeek: number;
}

export interface UpdateJobRequest {
    title: string;
    hourlyRate: number;
    firstDayOfWeek: number;
}

// ==================== ENTRY TYPES ====================

export interface EntryResponse {
    id: number;
    jobId: number;
    date: string;
    dayOfWeek: string;
    dayOfMonth: number;
    startTime: string | null;
    endTime: string | null;
    totalHours: number;
    hourlyRateSnapshot: number;
    totalEarnings: number;
    tip: number;
    note: string | null;
    overtimeHours: number;
    hasOvertime: boolean;
    createdAt: string;
}

export interface CreateEntryRequest {
    jobId: number;
    date: string; // ISO date string
    startTime: string | null;
    endTime: string | null;
    totalHours: number | null;
    tip: number;
    note: string | null;
}

export interface UpdateEntryRequest {
    date: string;
    startTime: string | null;
    endTime: string | null;
    totalHours: number | null;
    tip: number;
    note: string | null;
}

// ==================== EXPENSE TYPES ====================

export enum ExpenseCategory {
    FoodAndDrinks = 0,
    Transport = 1,
    Shopping = 2,
    BillsAndUtilities = 3,
    Entertainment = 4,
    Health = 5,
    Education = 6,
    Other = 7,
}

// Kategori bilgileri (icon, renk, isim)
export const EXPENSE_CATEGORIES = [
    { id: 0, name: 'Food & Drinks', icon: '🍔', color: '#f97316' },
    { id: 1, name: 'Transport', icon: '🚌', color: '#3b82f6' },
    { id: 2, name: 'Shopping', icon: '🛒', color: '#8b5cf6' },
    { id: 3, name: 'Bills & Utilities', icon: '💡', color: '#eab308' },
    { id: 4, name: 'Entertainment', icon: '🎬', color: '#ec4899' },
    { id: 5, name: 'Health', icon: '🏥', color: '#10b981' },
    { id: 6, name: 'Education', icon: '📚', color: '#06b6d4' },
    { id: 7, name: 'Other', icon: '📦', color: '#64748b' },
] as const;

export interface ExpenseResponse {
    id: number;
    amount: number;
    category: number;
    categoryName: string;
    date: string;
    description: string | null;
    source: string;
    receiptImageUrl: string | null;
    createdAt: string;
}

export interface WeeklyExpenseGroupResponse {
    weekStart: string;
    weekEnd: string;
    totalAmount: number;
    expenses: ExpenseResponse[];
}

export interface CreateExpenseRequest {
    amount: number;
    category: number;
    date: string; // ISO date string
    description?: string;
}

export interface UpdateExpenseRequest {
    amount: number;
    category: number;
    date: string;
    description?: string;
}

// ==================== WEEKLY GROUPING TYPES ====================

export interface WeeklyGroupResponse {
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    totalEarnings: number;
    overtimeBonus: number;
    entries: EntryResponse[];
}

export interface JobDetailsResponse {
    job: JobResponse;
    weeks: WeeklyGroupResponse[];
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardSummaryResponse {
    // All-time totals
    totalEarnings: number;
    totalHours: number;
    totalExpenses: number;
    activeJobsCount: number;
    jobs: JobResponse[];

    // Weekly summary
    weeklyEarnings: number;
    weeklyExpenses: number;
    weeklyNet: number;
    weeklyHours: number;
    weeklyGoal: WeeklyGoalStatusResponse | null;
    dailyEarningsSinceMonday: DailyEarningsPointResponse[];

    // Recent expenses
    recentExpenses: ExpenseResponse[];
}

export interface WeeklyGoalStatusResponse {
    targetAmount: number | null;
    currentAmount: number;
    remainingAmount: number;
    progressPercent: number;
    isReached: boolean;
    weekStart: string;
    weekEnd: string;
}

export interface DailyEarningsPointResponse {
    date: string;
    dayLabel: string;
    totalEarnings: number;
}

// ==================== NAVIGATION TYPES ====================

// Bottom Tab Navigator
export type TabParamList = {
    HomeTab: undefined;
    GoalTab: undefined;
    ExpensesTab: undefined;
    AddTab: undefined;
    OverviewTab: undefined;
    ProfileTab: undefined;
};

// Root Stack (Auth vs Main)
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    Paywall: {
        source: 'goals' | 'expenses' | 'job_limit' | 'locked_job' | 'profile' | 'dashboard';
        feature: 'premium' | 'goals' | 'expenses' | 'jobs';
    };
};

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

// Nested stacks inside tabs
export type HomeStackParamList = {
    Dashboard: undefined;
    Goal: undefined;
    JobDetails: { jobId: number };
};

export type OverviewStackParamList = {
    Overview: undefined;
    JobDetails: { jobId: number };
};

export type ExpenseStackParamList = {
    Expenses: undefined;
    ExpenseHistory: undefined;
};

export type GoalStackParamList = {
    Goal: undefined;
};

// Backward compat alias
export type MainStackParamList = HomeStackParamList;
