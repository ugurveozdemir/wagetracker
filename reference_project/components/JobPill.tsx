import React from 'react';
import { ArrowRight, Clock, DollarSign } from 'lucide-react';
import { Job } from '../types';

interface JobPillProps {
  job: Job;
  onClick?: () => void;
}

export const JobPill: React.FC<JobPillProps> = ({ job, onClick }) => {
  const totalHours = job.entries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEarnings = job.entries.reduce((sum, entry) => sum + entry.earnings, 0);
  
  // Get latest date from entries if available
  const sortedEntries = [...job.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayDate = sortedEntries.length > 0 
    ? new Date(sortedEntries[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    : 'New';

  return (
    <div 
      className={`group flex items-center justify-between p-4 mb-3 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${job.color} bg-opacity-40 border-opacity-30 hover:shadow-lg`}
      onClick={onClick}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{job.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold opacity-70">{displayDate}</span>
          
          {/* Mobile-only condensed details */}
          <span className="flex sm:hidden text-[10px] font-bold opacity-60 bg-white/40 px-1.5 py-0.5 rounded-full items-center gap-1">
             <Clock size={10} /> {totalHours.toFixed(1)}h
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
        {/* Desktop Detailed view */}
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="flex items-center gap-1 font-bold text-sm">
             <Clock size={14} className="opacity-60" />
             <span>{totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-sm">
             <DollarSign size={14} className="opacity-60" />
             <span>{job.rate}/h</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight">
            ${totalEarnings.toFixed(0)}
          </span>
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-50 flex items-center justify-center group-hover:bg-white transition-colors">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};