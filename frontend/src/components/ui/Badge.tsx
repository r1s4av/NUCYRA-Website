import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'teal' | 'amber' | 'emerald' | 'rose' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/70 text-cyan-400 border-cyan-800/80',
    teal: 'bg-teal-950/70 text-teal-300 border-teal-800/80',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
    neutral: 'bg-bio-850 text-slate-300 border-bio-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide font-mono ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
