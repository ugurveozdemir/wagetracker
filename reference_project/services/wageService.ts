
import { Job, Entry } from '../types';

const STORAGE_KEY = 'friendly_tracker_v2_jobs';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get random soft pastel color for job pills
const getRandomColor = () => {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-violet-50 text-violet-700 border-violet-100',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    'bg-teal-50 text-teal-700 border-teal-100',
    'bg-indigo-50 text-indigo-700 border-indigo-100',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getWeekKey = (dateStr: string, startDayOfWeek: number): string => {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0-6
  let diff = day - startDayOfWeek;
  if (diff < 0) diff += 7;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString();
};

// Recalculate earnings based on 40h weekly overtime rule (1.5x)
const recalculateJobEntries = (job: Job): Job => {
  // Sort entries chronologically (oldest first) to calculate accumulation correctly
  const sortedEntries = [...job.entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const weeklyHours: { [key: string]: number } = {};

  const recalculatedEntries = sortedEntries.map(entry => {
    const weekKey = getWeekKey(entry.date, job.startDayOfWeek);
    
    // Initialize week if new
    if (!weeklyHours[weekKey]) weeklyHours[weekKey] = 0;

    const currentAccumulated = weeklyHours[weekKey];
    const entryHours = entry.hours;
    let regularHours = entryHours;
    let overtimeHours = 0;

    // Check for overtime threshold (40 hours)
    if (currentAccumulated >= 40) {
      // Entire entry is overtime
      regularHours = 0;
      overtimeHours = entryHours;
    } else if (currentAccumulated + entryHours > 40) {
      // Split entry
      regularHours = 40 - currentAccumulated;
      overtimeHours = entryHours - regularHours;
    }

    // Update accumulation
    weeklyHours[weekKey] += entryHours;

    // Calculate Earnings
    const baseRate = job.rate;
    const overtimeRate = job.rate * 1.5;
    const earnings = (regularHours * baseRate) + (overtimeHours * overtimeRate) + (entry.tip || 0);

    return {
      ...entry,
      earnings,
      overtimeHours
    };
  });

  // Sort back to newest first for display
  return {
    ...job,
    entries: recalculatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
};

export const wageService = {
  getJobs: (): Job[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching jobs', error);
      return [];
    }
  },

  getJobById: (id: string): Job | undefined => {
    const jobs = wageService.getJobs();
    return jobs.find(j => j.id === id);
  },

  createJob: (name: string, rate: number, startDayOfWeek: number): Job => {
    const jobs = wageService.getJobs();
    const newJob: Job = {
      id: generateId(),
      name,
      rate,
      startDayOfWeek,
      color: getRandomColor(),
      entries: []
    };
    const updatedJobs = [newJob, ...jobs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
    return newJob;
  },

  deleteJob: (id: string): void => {
    const jobs = wageService.getJobs();
    const updatedJobs = jobs.filter((job) => job.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
  },

  addEntryToJob: (jobId: string, entryData: Omit<Entry, 'id' | 'earnings'>): Job | null => {
    const jobs = wageService.getJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex === -1) return null;

    const job = jobs[jobIndex];
    
    // Initial entry creation (earnings will be recalculated immediately)
    const newEntry: Entry = {
      ...entryData,
      id: generateId(),
      earnings: 0, // Placeholder
      overtimeHours: 0, // Placeholder
      tip: entryData.tip || 0
    };

    // Add entry
    job.entries.push(newEntry);
    
    // Recalculate all entries for this job to ensure weekly totals are correct
    const updatedJob = recalculateJobEntries(job);
    
    jobs[jobIndex] = updatedJob;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return updatedJob;
  },

  deleteEntry: (jobId: string, entryId: string): Job | null => {
    const jobs = wageService.getJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return null;

    let job = jobs[jobIndex];
    job.entries = job.entries.filter(e => e.id !== entryId);
    
    // Recalculate after deletion (as previous OT might now be regular hours)
    job = recalculateJobEntries(job);
    
    jobs[jobIndex] = job;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return job;
  },
  
  initialize: () => {
     const jobs = wageService.getJobs();
     if (jobs.length === 0) {
        const demoJob = wageService.createJob('Design Studio', 65, 1); // Monday start
        
        // Add demo entries (some triggering OT)
        // Week 1: 30h
        wageService.addEntryToJob(demoJob.id, { date: new Date().toISOString().split('T')[0], hours: 10, tip: 0 });
        wageService.addEntryToJob(demoJob.id, { date: new Date().toISOString().split('T')[0], hours: 10, tip: 0 });
        wageService.addEntryToJob(demoJob.id, { date: new Date().toISOString().split('T')[0], hours: 10, tip: 0 });
        
        // Week 2: 45h (5h OT)
        const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
        const d = lastWeek.toISOString().split('T')[0];
        wageService.addEntryToJob(demoJob.id, { date: d, hours: 12, tip: 0 });
        wageService.addEntryToJob(demoJob.id, { date: d, hours: 12, tip: 0 });
        wageService.addEntryToJob(demoJob.id, { date: d, hours: 12, tip: 0 });
        wageService.addEntryToJob(demoJob.id, { date: d, hours: 9, tip: 50 }); // Triggers OT
     }
  }
};
