
import React, { useState } from 'react';
import { X, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { JobInput } from '../types';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobInput) => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' },
];

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<JobInput>({
    name: '',
    rate: '',
    startDayOfWeek: 1, // Default Monday
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-violet-900/20 p-6 pb-8 sm:p-8 animate-slide-up sm:animate-in sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        
        {/* Mobile Handle & Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 relative">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full mb-6 sm:hidden opacity-50"></div>
            <div className="flex justify-between items-center w-full">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">New Job 💼</h2>
                <button 
                  onClick={onClose}
                  className="p-3 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors active:scale-90"
                  aria-label="Close"
                >
                  <X size={20} strokeWidth={3} />
                </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Client Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">Job / Client Name</label>
            <div className="relative group">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={24} />
              <input
                required
                type="text"
                placeholder="e.g. Design Studio"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 text-slate-800 text-xl font-bold rounded-3xl py-5 pl-14 pr-6 border-2 border-transparent focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-300 outline-none"
              />
            </div>
          </div>

          {/* Rate Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">Hourly Rate ($)</label>
            <div className="relative group">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={22} />
              <input
                required
                type="number"
                placeholder="0"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                className="w-full bg-slate-50 text-slate-800 text-xl font-bold rounded-3xl py-5 pl-12 pr-4 border-2 border-transparent focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-300 outline-none"
              />
            </div>
          </div>

          {/* Start Day of Week */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">First Day of Week</label>
            <p className="text-xs text-slate-400 ml-2 mb-2">Used to calculate weekly overtime/totals.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
               {DAYS_OF_WEEK.map(day => (
                 <button
                    key={day.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, startDayOfWeek: day.id }))}
                    className={`py-3 px-2 rounded-2xl font-bold text-sm transition-all border-2 ${
                        formData.startDayOfWeek === day.id 
                        ? 'bg-violet-100 border-violet-200 text-violet-700 shadow-sm' 
                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                    }`}
                 >
                    {day.label.slice(0,3)}
                 </button>
               ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth size="lg" className="text-xl py-5 shadow-violet-500/20">
                Create Job
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
