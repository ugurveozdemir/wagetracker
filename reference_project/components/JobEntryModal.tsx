
import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { EntryInput } from '../types';

interface JobEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: EntryInput) => void;
}

export const JobEntryModal: React.FC<JobEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [entryMode, setEntryMode] = useState<'total' | 'time'>('total');
  const [formData, setFormData] = useState<EntryInput>({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    startTime: '09:00',
    endTime: '17:00',
    tip: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        startTime: '09:00',
        endTime: '17:00',
        tip: '',
      });
      setEntryMode('total');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof EntryInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    let diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    if (diff < 0) diff += 24;
    return diff.toFixed(2);
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
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Add Entry ⚡️</h2>
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
          
          {/* Date Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">Date</label>
            <input
              required
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-lg font-bold rounded-3xl py-5 px-6 border-2 border-transparent focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-300 outline-none appearance-none"
            />
          </div>

          {/* Mode Toggle */}
          <div className="bg-slate-100 p-1.5 rounded-[2rem] flex relative">
            <button
              type="button"
              onClick={() => setEntryMode('total')}
              className={`flex-1 py-3.5 rounded-[1.7rem] text-sm sm:text-base font-extrabold transition-all duration-300 ${entryMode === 'total' ? 'bg-white text-violet-600 shadow-lg shadow-violet-100 scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'}`}
            >
              Total Hours
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('time')}
              className={`flex-1 py-3.5 rounded-[1.7rem] text-sm sm:text-base font-extrabold transition-all duration-300 ${entryMode === 'time' ? 'bg-white text-violet-600 shadow-lg shadow-violet-100 scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'}`}
            >
              Start / End
            </button>
          </div>

          {/* Time Inputs */}
          <div>
            {entryMode === 'total' ? (
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">Duration (Hours)</label>
                 <div className="relative group">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                    <input
                      type="number"
                      step="0.25"
                      placeholder="e.g. 8.5"
                      value={formData.hours}
                      onChange={(e) => handleChange('hours', e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-xl font-bold rounded-3xl py-5 pl-14 pr-6 border-2 border-transparent focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-300 outline-none"
                    />
                 </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Start</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleChange('startTime', e.target.value)}
                        className="w-full bg-slate-50 text-lg font-bold text-slate-800 rounded-3xl py-4 px-2 text-center border-2 border-transparent focus:border-violet-300 focus:bg-white outline-none"
                      />
                    </div>
                    <div className="text-slate-300 pt-6">➜</div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">End</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleChange('endTime', e.target.value)}
                        className="w-full bg-slate-50 text-lg font-bold text-slate-800 rounded-3xl py-4 px-2 text-center border-2 border-transparent focus:border-violet-300 focus:bg-white outline-none"
                      />
                    </div>
                 </div>
                 <div className="text-center">
                     <span className="text-sm font-medium text-slate-400">Calculated: </span>
                     <span className="text-lg font-black text-violet-600">{calculateDuration()} hrs</span>
                 </div>
              </div>
            )}
          </div>

          {/* Tip Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wider">Tips / Bonus (Optional)</label>
            <div className="relative group">
              <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input
                type="number"
                placeholder="0.00"
                value={formData.tip}
                onChange={(e) => handleChange('tip', e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xl font-bold rounded-3xl py-5 pl-14 pr-6 border-2 border-transparent focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth size="lg" className="text-xl py-5 shadow-violet-500/20">
                Add to Job
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
