import React from 'react';

interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const SoftCard: React.FC<SoftCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hoverEffect = false
}) => {
  const baseClasses = "bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-100/50 relative overflow-hidden";
  const hoverClasses = hoverEffect ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/50 cursor-pointer" : "";
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};