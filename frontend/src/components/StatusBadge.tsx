import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert, KeyRound } from 'lucide-react';
import { VerificationStatus } from '../types';

interface StatusBadgeProps {
  status: VerificationStatus | 'PENDING';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-bold'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (status === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 ${sizeClasses[size]}`}>
        <CheckCircle2 className={`${iconSizes[size]} text-emerald-600`} />
        <span>VERIFIED</span>
      </span>
    );
  }

  if (status === 'PARTIAL_VERIFIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}>
        <AlertTriangle className={`${iconSizes[size]} text-amber-600`} />
        <span>PARTIAL VERIFIED</span>
      </span>
    );
  }

  if (status === 'CONSENT_DENIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses[size]}`}>
        <ShieldAlert className={`${iconSizes[size]} text-rose-600`} />
        <span>CONSENT DENIED</span>
      </span>
    );
  }

  if (status === 'CONSENT_PENDING') {
    return (
      <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-800 border border-sky-300 ${sizeClasses[size]}`}>
        <KeyRound className={`${iconSizes[size]} text-sky-600 animate-pulse`} />
        <span>CONSENT PENDING</span>
      </span>
    );
  }

  if (status === 'REQUEST_DENIED' || status === 'FAILED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses[size]}`}>
        <XCircle className={`${iconSizes[size]} text-rose-600`} />
        <span>REQUEST DENIED</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}>
      <Clock className={`${iconSizes[size]} text-slate-500 animate-spin`} />
      <span>PENDING</span>
    </span>
  );
};
