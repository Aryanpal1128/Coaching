import React from 'react';
import { Card } from './Card.jsx';
import { CaretRight } from '@phosphor-icons/react';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', onClick }) => {
  const iconColors = {
    emerald: 'text-[#C5A059] shadow-[#C5A059]/30', // Map emerald to gold
    rose: 'text-[#E53E6B] shadow-[#E53E6B]/30', // Red/Pink
    purple: 'text-[#9B59B6] shadow-[#9B59B6]/30', // Purple
    slate: 'text-[#2DD4BF] shadow-[#2DD4BF]/30', // Teal
    amber: 'text-[#9B59B6] shadow-[#9B59B6]/30', // Map amber to purple
    blue: 'text-brand-500 shadow-brand-500/30'
  };
  
  const ringColors = {
    emerald: 'border-[#C5A059]',
    rose: 'border-[#E53E6B]',
    purple: 'border-[#9B59B6]',
    slate: 'border-[#2DD4BF]',
    amber: 'border-[#9B59B6]',
    blue: 'border-brand-500'
  };

  const isClickable = !!onClick;

  return (
    <Card
      hover={isClickable}
      onClick={onClick}
      className={`border border-theme-border bg-theme-card shadow-theme transition-all duration-150 p-4 ${
        isClickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 hover:border-theme-border'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`w-12 h-12 rounded-full border border-solid flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0)] ${ringColors[color] || ringColors.blue} ${iconColors[color] || iconColors.blue}`}>
              <div className={`w-full h-full rounded-full flex items-center justify-center shadow-[inset_0_0_10px_rgba(255,255,255,0.1),0_0_15px_var(--tw-shadow-color)]`}>
                <Icon size={24} weight="fill" className="drop-shadow-lg" />
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary mb-0.5">
              {title}
            </p>
            <div className="text-xl font-extrabold text-theme-primary leading-tight">
              {value}
            </div>
            {trend && (
              <p className="text-[11px] text-theme-secondary font-medium mt-0.5">
                {trend}
              </p>
            )}
          </div>
        </div>
        {isClickable && (
          <div className="text-theme-secondary pl-2">
            <CaretRight size={20} weight="bold" />
          </div>
        )}
      </div>
    </Card>
  );
};
