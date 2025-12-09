
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, DollarSign, Trash2, Flame } from 'lucide-react';
import { SoftCard } from './ui/SoftCard';
import { JobEntryModal } from './JobEntryModal';
import { wageService } from '../services/wageService';
import { Job, Entry, EntryInput } from '../types';

interface WeekGroup {
  startDate: Date;
  endDate: Date;
  entries: Entry[];
  totalHours: number;
  totalEarnings: number;
  overtimeHours: number;
  overtimeEarnings: number;
}

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const loadedJob = wageService.getJobById(id);
      if (loadedJob) {
        setJob(loadedJob);
      } else {
        navigate('/dashboard');
      }
    }
  }, [id, navigate]);

  const handleAddEntry = (data: EntryInput) => {
    if (!job) return;

    let hours = 0;
    if (data.hours === '' && data.startTime && data.endTime) {
       const start = new Date(`2000-01-01T${data.startTime}`);
       const end = new Date(`2000-01-01T${data.endTime}`);
       let diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
       if (diff < 0) diff += 24;
       hours = diff;
    } else {
       hours = parseFloat(data.hours) || 0;
    }

    const updatedJob = wageService.addEntryToJob(job.id, {
      date: data.date,
      hours: hours,
      startTime: data.startTime,
      endTime: data.endTime,
      tip: data.tip ? parseFloat(data.tip) : 0
    });
    
    if (updatedJob) setJob(updatedJob);
  };

  const handleDeleteEntry = (entryId: string) => {
      if(!job) return;
      if(window.confirm("Remove this entry?")) {
          const updatedJob = wageService.deleteEntry(job.id, entryId);
          if (updatedJob) setJob(updatedJob);
      }
  }

  // Grouping Logic
  const getWeeklyGroups = (): WeekGroup[] => {
    if (!job || job.entries.length === 0) return [];

    const groups: { [key: string]: WeekGroup } = {};

    job.entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay(); // 0 (Sun) to 6 (Sat)
      const startDay = job.startDayOfWeek; // e.g., 1 (Mon)

      // Calculate the difference to get to the start of the week
      let diff = dayOfWeek - startDay;
      if (diff < 0) diff += 7;
      
      const weekStartDate = new Date(entryDate);
      weekStartDate.setDate(entryDate.getDate() - diff);
      weekStartDate.setHours(0,0,0,0);
      
      const key = weekStartDate.toISOString();

      if (!groups[key]) {
        const endDate = new Date(weekStartDate);
        endDate.setDate(weekStartDate.getDate() + 6);
        groups[key] = {
          startDate: weekStartDate,
          endDate: endDate,
          entries: [],
          totalHours: 0,
          totalEarnings: 0,
          overtimeHours: 0,
          overtimeEarnings: 0,
        };
      }

      // Calculate pure overtime earnings for display stats
      // Note: entry.earnings already contains tips and OT. 
      // We estimate OT earnings component as (OT hours * Rate * 1.5)
      const otEarnings = (entry.overtimeHours || 0) * (job.rate * 1.5);

      groups[key].entries.push(entry);
      groups[key].totalHours += entry.hours;
      groups[key].totalEarnings += entry.earnings;
      groups[key].overtimeHours += (entry.overtimeHours || 0);
      groups[key].overtimeEarnings += otEarnings;
    });

    // Sort groups by date descending
    return Object.values(groups).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  };

  if (!job) return null;

  const totalJobEarnings = job.entries.reduce((sum, e) => sum + e.earnings, 0);
  const totalJobHours = job.entries.reduce((sum, e) => sum + e.hours, 0);
  const weekGroups = getWeeklyGroups();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      
      {/* Navbar */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-4 py-4">
         <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors">
               <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 truncate px-4">{job.name}</h1>
            <div className="w-10"></div> {/* Spacer */}
         </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* Header Cards - Now using Dashboard Gradients */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
           {/* Earnings Card - Emerald Gradient */}
           <SoftCard className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-4 sm:p-6 !rounded-[2rem] shadow-lg shadow-emerald-200/50 border-none">
               <div className="flex items-center gap-2 mb-2 text-emerald-100">
                   <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                       <DollarSign size={14} />
                   </div>
                   <span className="text-xs font-bold uppercase tracking-wider">Earned</span>
               </div>
               <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  ${totalJobEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
               </div>
           </SoftCard>
           
           {/* Hours Card - Violet Gradient */}
           <SoftCard className="bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white p-4 sm:p-6 !rounded-[2rem] shadow-lg shadow-violet-200/50 border-none">
               <div className="flex items-center gap-2 mb-2 text-violet-100">
                   <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                       <Clock size={14} />
                   </div>
                   <span className="text-xs font-bold uppercase tracking-wider">Hours</span>
               </div>
               <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  {totalJobHours.toFixed(1)}<span className="text-xl opacity-80">h</span>
               </div>
           </SoftCard>
        </div>

        {/* Weekly Groups */}
        <div className="space-y-8">
           {weekGroups.map((group, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                 
                 {/* Week Header */}
                 <div className="px-2 mb-3">
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-1">
                                Week of {group.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-slate-400 text-xs font-medium">
                                To {group.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-800 font-extrabold text-lg">${group.totalEarnings.toFixed(0)}</span>
                            <span className="text-slate-400 text-sm font-semibold ml-2">{group.totalHours.toFixed(1)}h</span>
                        </div>
                    </div>
                    
                    {/* Overtime Summary Line */}
                    {group.overtimeHours > 0 && (
                        <div className="mt-3 flex items-center justify-between bg-orange-50 rounded-xl p-2 px-3 border border-orange-100">
                           <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wide">
                               <Flame size={14} className="fill-orange-500" />
                               Overtime Bonus
                           </div>
                           <div className="text-orange-700 font-bold text-sm">
                               +{group.overtimeHours.toFixed(1)}h <span className="opacity-60 text-xs">(${group.overtimeEarnings.toFixed(0)})</span>
                           </div>
                        </div>
                    )}
                 </div>

                 {/* Entries List */}
                 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {group.entries.map((entry, idx) => (
                        <div 
                           key={entry.id} 
                           className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${idx !== group.entries.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex flex-col items-center justify-center font-bold leading-none flex-shrink-0">
                                    <span className="text-[10px] uppercase">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-sm text-slate-800">{new Date(entry.date).getDate()}</span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 text-lg leading-tight flex items-center gap-2">
                                        {entry.hours} hrs
                                        {/* Overtime Badge on specific entry */}
                                        {entry.overtimeHours && entry.overtimeHours > 0 ? (
                                            <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold border border-orange-200">
                                                1.5x
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mt-0.5 flex flex-wrap gap-x-2">
                                        <span>{entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : 'Duration only'}</span>
                                        {entry.tip && entry.tip > 0 && (
                                            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                                                • ${entry.tip} tip
                                            </span>
                                        )}
                                        {entry.overtimeHours && entry.overtimeHours > 0 ? (
                                            <span className="text-orange-400 font-medium">
                                                • {entry.overtimeHours.toFixed(1)}h OT
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800 text-lg">${entry.earnings.toFixed(0)}</span>
                                <button 
                                   onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                                   className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                   <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
           ))}

           {weekGroups.length === 0 && (
               <div className="text-center py-12 text-slate-400">
                   <p>No entries yet. Tap + to add hours.</p>
               </div>
           )}
        </div>

      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 rounded-full text-white shadow-xl shadow-slate-400/50 flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <JobEntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEntry}
      />
    </div>
  );
};

export default JobDetails;
