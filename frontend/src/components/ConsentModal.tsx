import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  GraduationCap,
  Landmark,
  Home,
  Lock,
  CreditCard,
  HeartPulse,
  Filter
} from 'lucide-react';
import { ConsentPendingResponse } from '../types';

interface ConsentModalProps {
  consentData: ConsentPendingResponse;
  onDecision: (decision: 'ALLOW' | 'DENY') => void;
  submitting: boolean;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  consentData,
  onDecision,
  submitting
}) => {
  const requestedFields = consentData.consent.requestedFields || [];

  const getFieldInfo = (field: string) => {
    const f = field.toLowerCase();
    if (f.includes('education')) {
      return {
        icon: <GraduationCap className="w-4 h-4 text-sky-700 flex-shrink-0" />,
        label: 'Educational Qualification',
        department: 'Higher Education Registry',
        isPermittedByPolicy: true
      };
    }
    if (f.includes('income')) {
      return {
        icon: <Landmark className="w-4 h-4 text-emerald-700 flex-shrink-0" />,
        label: 'Annual Family Income',
        department: 'Revenue Department',
        isPermittedByPolicy: true
      };
    }
    if (f.includes('residence')) {
      return {
        icon: <Home className="w-4 h-4 text-indigo-700 flex-shrink-0" />,
        label: 'Residence State Domicile',
        department: 'Municipal Authority',
        isPermittedByPolicy: true
      };
    }
    if (f.includes('bank') || f.includes('balance')) {
      return {
        icon: <CreditCard className="w-4 h-4 text-amber-700 flex-shrink-0" />,
        label: 'Bank Account Balance',
        department: 'Financial Institution',
        isPermittedByPolicy: false
      };
    }
    if (f.includes('medical') || f.includes('health')) {
      return {
        icon: <HeartPulse className="w-4 h-4 text-rose-700 flex-shrink-0" />,
        label: 'Medical & Health History',
        department: 'Health Registry',
        isPermittedByPolicy: false
      };
    }
    return {
      icon: <Lock className="w-4 h-4 text-slate-700 flex-shrink-0" />,
      label: field,
      department: 'External Registry',
      isPermittedByPolicy: false
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#0F2642] text-white p-6 flex-shrink-0">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              EkSetu Citizen Authorization
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            EkSetu Consent Request
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Scholarship Eligibility Verification
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                Requested By
              </span>
              <span className="font-bold text-slate-800">
                {consentData.serviceName || 'Scholarship Service'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                Access Type
              </span>
              <span className="font-bold text-emerald-700 flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>One-time verification</span>
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                Purpose
              </span>
              <span className="font-bold text-slate-800">
                {consentData.consent.purpose}
              </span>
            </div>
            <div className="col-span-2 pt-1">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                Reference number:
              </span>
              <span className="font-mono font-bold text-sky-800 text-xs">
                {consentData.requestId}
              </span>
            </div>
          </div>

          {/* Requested Fields List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Information Requested ({requestedFields.length} fields)
              </h4>
              <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                <Filter className="w-3 h-3 text-sky-600" />
                <span>Policy Filter Applied on Release</span>
              </span>
            </div>

            <div className="space-y-2">
              {requestedFields.map((field, idx) => {
                const info = getFieldInfo(field);
                return (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs ${
                      info.isPermittedByPolicy
                        ? 'bg-sky-50/60 border-sky-100'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    {info.isPermittedByPolicy ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] text-amber-700 font-bold flex-shrink-0">
                        !
                      </span>
                    )}
                    {info.icon}
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{info.label}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {info.department} {info.isPermittedByPolicy ? '' : '— Subject to policy minimization filter'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citizen Notice / Plain Language */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <p>
              Your information will be used only to verify your eligibility for this scholarship application. EkSetu will request the selected information from the relevant government data providers.
            </p>
            <p className="font-bold mt-1 text-amber-950">
              Consent allows the request to proceed. Policy determines which information can actually be released.
            </p>
          </div>
        </div>

        {/* Action Buttons (DENY / ALLOW) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onDecision('DENY')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Deny access</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => onDecision('ALLOW')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Allow & continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
