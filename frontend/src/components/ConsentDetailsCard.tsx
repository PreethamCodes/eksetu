import React, { useState } from 'react';
import { ChevronDown, ChevronUp, KeyRound, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { ConsentRecord } from '../types';

interface ConsentDetailsCardProps {
  consent?: ConsentRecord;
  requestId: string;
  consentDecision: 'GRANTED' | 'DENIED' | 'PENDING';
  serviceName?: string;
}

export const ConsentDetailsCard: React.FC<ConsentDetailsCardProps> = ({
  consent,
  requestId,
  consentDecision,
  serviceName = 'Scholarship Service'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isGranted = consentDecision === 'GRANTED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-[#0F2642]">
            View Consent Record
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            isGranted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-rose-50 text-rose-700 border-rose-300'
          }`}>
            {isGranted ? 'Decision: Granted' : 'Decision: Denied'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-sky-800 font-semibold self-end sm:self-auto">
          <span>{isOpen ? 'Hide Record' : 'View Details'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 bg-white border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Reference number:
              </span>
              <span className="font-mono font-bold text-slate-800">{requestId}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Requested By
              </span>
              <span className="font-bold text-slate-800">{serviceName}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Purpose
              </span>
              <span className="font-bold text-slate-800">{consent?.purpose || 'Scholarship Eligibility'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Access Type
              </span>
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>One-time verification</span>
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Information Requested
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Academic qualification
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Family annual income
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  State domicile
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Citizen Decision
              </span>
              <span className={`inline-flex items-center space-x-1 font-bold mt-0.5 ${
                isGranted ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isGranted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{isGranted ? 'Granted' : 'Denied'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[11px]">
                Timestamp
              </span>
              <span className="text-slate-600 font-medium">
                {consent?.createdAt ? new Date(consent.createdAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
