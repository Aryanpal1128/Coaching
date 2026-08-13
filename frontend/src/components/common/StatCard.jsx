import React from 'react';
import { Card } from './Card.jsx';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', onClick }) => {
  const cardTints = {
    emerald: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
    rose: 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40',
    purple: 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
    slate: 'bg-slate-500/5 border-slate-500/20 hover:border-slate-500/40',
    blue: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
    indigo: 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40',
    amber: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
  };

  const iconColors = {
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    blue: 'bg-blue-500/15 text-blue-500',
    indigo: 'bg-indigo-500/15 text-indigo-500',
    amber: 'bg-amber-500/15 text-amber-500'
  };

  const isClickable = !!onClick;

  return (
    <Card
      hover={isClickable}
      onClick={onClick}
      className={`border ${cardTints[color] || ''} transition-all duration-150 ${
        isClickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </div>
          {trend && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-2xl ${iconColors[color] || iconColors.blue}`}>
            <Icon size={24} weight="duotone" className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};
