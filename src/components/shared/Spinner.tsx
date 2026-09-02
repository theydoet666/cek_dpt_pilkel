import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3 text-slate-600">
      <Loader2 className={clsx('animate-spin text-emerald-700', sizes[size], className)} />
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );
};
