
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Track wages,\nnot headaches.",
    description: "The friendliest way to log hours and see exactly what you've earned.",
    icon: <Clock size={48} className="text-white" />,
    bgGradient: "bg-gradient-to-br from-violet-400 to-fuchsia-500",
    shadowColor: "shadow-violet-300",
    textColor: "text-violet-900",
    blobColor: "bg-violet-200"
  },
  {
    id: 2,
    title: "Overtime math?\nSolved.",
    description: "We automatically calculate 1.5x overtime after 40 hours. No calculator needed.",
    icon: <Sparkles size={48} className="text-white" />,
    bgGradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    shadowColor: "shadow-amber-300",
    textColor: "text-amber-900",
    blobColor: "bg-amber-200"
  },
  {
    id: 3,
    title: "Your data stays\nwith you.",
    description: "Everything is stored locally on your device. Private, fast, and secure.",
    icon: <Wallet size={48} className="text-white" />,
    bgGradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
    shadowColor: "shadow-emerald-300",
    textColor: "text-emerald-900",
    blobColor: "bg-emerald-200"
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const activeStep = ONBOARDING_STEPS[currentStep];

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      
      {/* Background Blobs (Animated) */}
      <div 
        key={activeStep.id} // Re-render animation on step change
        className={`absolute top-[-10%] right-[-20%] w-[300px] h-[300px] rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse ${activeStep.blobColor} transition-colors duration-700`} 
      />
      <div className="absolute bottom-[-10%] left-[-20%] w-[250px] h-[250px] bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

      {/* Top Bar */}
      <div className="flex justify-end p-6 z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-sm font-bold text-slate-400 hover:text-slate-600 px-4 py-2"
        >
          Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        
        {/* Animated Icon Card */}
        <div className="mb-12 relative">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] ${activeStep.bgGradient} shadow-2xl ${activeStep.shadowColor} flex items-center justify-center transform transition-all duration-500 hover:scale-105 hover:-translate-y-2`}>
                {activeStep.icon}
            </div>
            {/* Decorative ring */}
            <div className={`absolute inset-0 rounded-[2rem] border-2 border-white opacity-20 transform scale-110`} />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 max-w-sm transition-opacity duration-500">
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] ${activeStep.textColor} whitespace-pre-line`}>
            {activeStep.title}
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            {activeStep.description}
          </p>
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="p-8 pb-10 w-full z-10">
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? `w-8 ${activeStep.bgGradient.split(' ')[1].replace('from-', 'bg-')}` 
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleNext}
          className="shadow-xl text-xl py-5 rounded-full flex items-center justify-center gap-2 group"
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? (
             <>
               Get Started
               <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
             </>
          ) : (
             <>
               Continue
               <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </>
          )}
        </Button>

      </div>
    </div>
  );
};

export default LandingPage;
