import React from 'react';

export const Badge = ({ children, variant = 'blue', size = 'sm', className = '' }) => {
  const variants = {
    blue: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    indigo: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    purple: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    emerald: 'bg-green-500/10 text-green-500 border-green-500/20',
    amber: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    rose: 'bg-red-500/10 text-red-400 border-red-500/20',
    dark: 'bg-white/5 text-[#F5F3FA] border-white/10'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
