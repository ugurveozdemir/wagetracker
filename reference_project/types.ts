
export interface Entry {
  id: string;
  date: string;
  hours: number;
  startTime?: string;
  endTime?: string;
  earnings: number;
  tip?: number; 
  overtimeHours?: number; // Added overtime tracking
}

export interface Job {
  id: string;
  name: string; // Client Name
  rate: number; // Hourly Rate
  startDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  color: string; // Visual theme
  entries: Entry[];
}

export interface JobInput {
  name: string;
  rate: string;
  startDayOfWeek: number;
}

export interface EntryInput {
  date: string;
  hours: string;
  startTime: string;
  endTime: string;
  tip: string; 
}
