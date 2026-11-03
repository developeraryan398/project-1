import React from 'react';
import { ComplaintPriority } from '../../types';
import { ArrowDownCircle, AlertCircle, Flame, AlertOctagon } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-semibold';

  if (priority === 'Urgent') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-rose-100 text-rose-800 border border-rose-300 shadow-xs font-bold ${sizeClasses} ${className}`}
      >
        <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>Urgent Priority</span>
      </span>
    );
  }

  if (priority === 'High') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-semibold ${sizeClasses} ${className}`}
      >
        <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
        <span>High Priority</span>
      </span>
    );
  }

  if (priority === 'Medium') {
    return (
      <span
        className={`inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs ${sizeClasses} ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
        <span>Medium Priority</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
    >
      <ArrowDownCircle className="w-3.5 h-3.5 text-slate-500" />
      <span>Low Priority</span>
    </span>
  );
};
