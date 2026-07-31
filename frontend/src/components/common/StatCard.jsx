import React from 'react';
import { Card } from './Card.jsx';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const iconColors = {
    blue: 'bg-blue-500/10 text-blue-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    purple: 'bg-purple-500/10 text-purple-500'
  };

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </h3>
          {trend && (
            <p className="text-xs text-emerald-500 font-medium mt-1">
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-2xl ${iconColors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};
