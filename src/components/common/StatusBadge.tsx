import React from 'react';
import { ComplaintStatus } from '../../types';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  isOverdue?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isOverdue = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  if (isOverdue && !['Resolved', 'Verified', 'Rejected'].includes(status)) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-100 text-rose-700 border border-rose-300 animate-pulse ${sizeClasses} ${className}`}
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Overdue: {status}</span>
      </span>
    );
  }

  const config: Record<ComplaintStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    Submitted: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    Assigned: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    Accepted: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    'In Progress': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Wrench className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />,
    },
    Resolved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    Verified: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />,
    },
    Reopened: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
    Rejected: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const current = config[status] || config.Submitted;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} shadow-xs ${sizeClasses} ${className}`}
    >
      {current.icon}
      <span>{status}</span>
    </span>
  );
};
