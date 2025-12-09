
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { SoftCard } from './ui/SoftCard';
import { Button } from './ui/Button';
import { CreateJobModal } from './CreateJobModal';
import { wageService } from '../services/wageService';
import { Job, JobInput } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load jobs
  useEffect(() => {
    wageService.initialize();
    const loadedJobs = wageService.getJobs();
    setJobs(loadedJobs);
  }, []);

  // Calculate Global Totals (Sum of all job entries)
  const totalEarnings = jobs.reduce((sum, job) => 
    sum + job.entries.reduce((eSum, entry) => eSum + entry.earnings, 0), 0);
    
  const totalHours = jobs.reduce((sum, job) => 
    sum + job.entries.reduce((hSum, entry) => hSum + entry.hours, 0), 0);
  
  const handleCreateJob = (data: JobInput) => {
    const newJob = wageService.createJob(data.name, parseFloat(data.rate), data.startDayOfWeek);
    setJobs(prev => [newJob, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-8 relative"> 
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 sm:border-none sm:bg-transparent sm:static">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Hi, <span className="text-violet-600">Creator!</span> 👋
            </h1>
            <p className="hidden sm:block text-slate-500 font-medium">Manage your freelance gigs here.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="secondary" className="w-10 h-10 p-0 rounded-full flex items-center justify-center sm:hidden" onClick={() => {}}>
               <Search size={20} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="hidden sm:flex">
              <Plus size={20} />
              <span>New Job</span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm sm:hidden"></div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 pt-4 max-w-7xl mx-auto">
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          
          {/* Welcome/Date Widget */}
          <SoftCard className="md:col-span-1 bg-white flex flex-row sm:flex-col justify-between items-center sm:items-start min-h-[100px] sm:min-h-[200px]">
            <div className="flex-1">
               <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-2">Today</span>
               <div className="flex flex-col">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 leading-none">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short' })}.
                  </h2>
                  <p className="text-lg sm:text-xl text-slate-400 font-semibold">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
               </div>
            </div>
            <div className="sm:mt-4 sm:pt-4 sm:border-t sm:border-slate-100 text-right sm:text-left">
               <p className="text-slate-500 text-xs sm:text-sm font-medium">
                 <span className="text-violet-600 font-bold text-lg sm:text-base">{jobs.length}</span> active jobs
               </p>
            </div>
          </SoftCard>

          {/* Money Shot: Earnings */}
          <SoftCard className="md:col-span-1 bg-gradient-to-br from-emerald-400 to-teal-500 text-white min-h-[160px] sm:min-h-[200px] border-none shadow-lg shadow-emerald-200/50">
            <div className="flex justify-between items-start">
               <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">💰</span>
               </div>
               <span className="text-emerald-100 font-bold text-xs sm:text-sm tracking-wider uppercase">Total Earnings</span>
            </div>
            <div className="mt-6 sm:mt-8">
              <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <p className="text-emerald-100 font-medium mt-1 text-sm sm:text-base">All time</p>
            </div>
          </SoftCard>

          {/* Money Shot: Hours */}
          <SoftCard className="md:col-span-1 bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white min-h-[160px] sm:min-h-[200px] border-none shadow-lg shadow-violet-200/50">
            <div className="flex justify-between items-start">
               <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">⏳</span>
               </div>
               <span className="text-violet-100 font-bold text-xs sm:text-sm tracking-wider uppercase">Total Hours</span>
            </div>
            <div className="mt-6 sm:mt-8">
              <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {totalHours.toFixed(1)}<span className="text-2xl sm:text-3xl opacity-80">h</span>
              </h3>
              <p className="text-violet-100 font-medium mt-1 text-sm sm:text-base">Across all jobs</p>
            </div>
          </SoftCard>

        </div>

        {/* My Jobs List */}
        <div>
           <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-800">My Jobs</h2>
           </div>
           
           <div className="space-y-3">
             {jobs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium mb-4">No jobs created yet.</p>
                   <Button onClick={() => setIsModalOpen(true)}>Create your first job</Button>
                </div>
             ) : (
               jobs.map(job => {
                 const jobEarnings = job.entries.reduce((acc, curr) => acc + curr.earnings, 0);
                 const jobHours = job.entries.reduce((acc, curr) => acc + curr.hours, 0);

                 return (
                   <div 
                     key={job.id}
                     onClick={() => navigate(`/job/${job.id}`)}
                     className={`group relative flex items-center justify-between p-4 sm:p-5 mb-3 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${job.color} bg-opacity-30 border-opacity-30 hover:shadow-lg`}
                   >
                     <div className="flex flex-col min-w-0 pr-2">
                       <h3 className="font-extrabold text-lg sm:text-xl leading-tight truncate text-slate-800">{job.name}</h3>
                       <p className="text-sm font-semibold opacity-70 mt-1">${job.rate}/hr • {jobHours}h total</p>
                     </div>
                     
                     <div className="flex items-center gap-3">
                       <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
                         ${jobEarnings.toFixed(0)}
                       </span>
                       <div className="w-10 h-10 rounded-full bg-white bg-opacity-60 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                         <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-800" />
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 rounded-full text-white shadow-xl shadow-violet-400/50 flex items-center justify-center sm:hidden z-40 active:scale-90 transition-transform"
        aria-label="Add New Job"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateJob}
      />
    </div>
  );
};

export default Dashboard;
