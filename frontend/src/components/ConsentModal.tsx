import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, GraduationCap, Landmark, Home, Lock } from 'lucide-react';
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#0F2642] text-white p-6">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              EKSetu Citizen Authorization
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            EKSetu Consent Request
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Scholarship Eligibility Verification
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
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
                Request ID
              </span>
              <span className="font-mono font-bold text-sky-800 text-xs">
                {consentData.requestId}
              </span>
            </div>
          </div>

          {/* Requested Fields List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              The Scholarship Service is requesting access to:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-sky-50/60 border border-sky-100 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <GraduationCap className="w-4 h-4 text-sky-700 flex-shrink-0" />
                <span className="font-semibold text-slate-800">Educational Qualification</span>
                <span className="text-[11px] text-slate-500 ml-auto">(Higher Education Registry)</span>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <Landmark className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="font-semibold text-slate-800">Annual Family Income</span>
                <span className="text-[11px] text-slate-500 ml-auto">(Revenue Department)</span>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <Home className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                <span className="font-semibold text-slate-800">Residence State Domicile</span>
                <span className="text-[11px] text-slate-500 ml-auto">(Municipal Authority)</span>
              </div>
            </div>
          </div>

          {/* Citizen Notice / Plain Language */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <p>
              Your information will be used only to verify your eligibility for this scholarship application. EKSetu will request the selected information from the relevant government data providers.
            </p>
            <p className="font-bold mt-1 text-amber-950">
              You can choose whether to allow or deny this request.
            </p>
          </div>
        </div>

        {/* Action Buttons (DENY / ALLOW) */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onDecision('DENY')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>DENY ACCESS</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => onDecision('ALLOW')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>ALLOW & VERIFY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
