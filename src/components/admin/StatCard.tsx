import React from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'slate';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'emerald',
  trend,
}) => {

  const iconBgs = {
    emerald: 'bg-emerald-700 text-white',
    blue: 'bg-blue-700 text-white',
    indigo: 'bg-indigo-700 text-white',
    amber: 'bg-amber-700 text-white',
    slate: 'bg-slate-800 text-white',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
          </h4>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className={clsx('p-3 rounded-2xl shadow-sm shrink-0', iconBgs[variant])}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
