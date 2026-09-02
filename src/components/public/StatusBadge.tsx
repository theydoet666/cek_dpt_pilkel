import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const upper = (status || '').toUpperCase();

  let config = {
    label: 'Terdaftar (DPT Lolos)',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  };

  if (upper === 'BARU' || upper.includes('BARU')) {
    config = {
      label: 'Terdaftar (Pemilih Baru)',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" />,
    };
  } else if (upper === 'DPS' || upper.includes('DPS')) {
    config = {
      label: 'Daftar Pemilih Sementara (DPS)',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />,
    };
  } else if (upper === 'TIDAK_LOLOS' || upper.includes('TIDAK')) {
    config = {
      label: 'Tidak Memenuhi Syarat (TMS)',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    };
  }

  const sizes = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3.5 py-1.5 gap-1.5',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full border shadow-2xs',
        config.bg,
        sizes[size]
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
