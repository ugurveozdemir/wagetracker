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

export interface UserDto {
    id: number;
    email: string;
    fullName: string;
}

// ==================== JOB TYPES ====================

export interface JobResponse {
    id: number;
    title: string;
    hourlyRate: number;
    firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    totalEarnings: number;
    totalHours: number;
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
    totalEarnings: number;
    totalHours: number;
    activeJobsCount: number;
    jobs: JobResponse[];
}

// ==================== NAVIGATION TYPES ====================

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainStackParamList = {
    Dashboard: undefined;
    JobDetails: { jobId: number };
};
