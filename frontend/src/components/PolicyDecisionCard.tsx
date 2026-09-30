import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Filter,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { PolicyEvaluationResult } from '../types';
import { getPolicyDecisionDetails, getFieldLabel, humanizeText } from '../utils/displayLabels';

interface PolicyDecisionCardProps {
  policy: PolicyEvaluationResult;
}

export const PolicyDecisionCard: React.FC<PolicyDecisionCardProps> = ({ policy }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const decisionInfo = getPolicyDecisionDetails(policy.decision);

  return (
    <div className="bg-white rounded-2xl border border-sky-200 p-6 sm:p-7 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-100">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                EkSetu Policy Engine
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-mono text-slate-500">
                {policy.policyId}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0F2642] mt-0.5">
              Data Minimization Evaluation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Purpose: <strong className="text-slate-700">{humanizeText(policy.purpose)}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${decisionInfo.badgeClass}`}>
            {decisionInfo.label}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 max-w-xs text-left sm:text-right">
            {decisionInfo.description}
          </span>
        </div>
      </div>

      {/* Core Principle Callout */}
      <div className="mt-4 p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-[#0F2642]">Core Privacy Principle: </strong>
          Consent allows the request to proceed. Policy determines which information can actually be released.
        </div>
      </div>

      {/* Data Minimization Pipeline Diagram */}
      <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
          Data Minimization Pipeline
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          {/* Step 1: Requested */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 w-full sm:w-1/3 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Requested Data</span>
            <span className="text-base font-black text-slate-800">{policy.totalRequested} fields</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Declared by Service</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />

          {/* Step 2: Policy Engine */}
          <div className="bg-[#0F2642] text-white p-3 rounded-lg w-full sm:w-1/3 shadow-sm">
            <span className="text-[10px] font-bold text-sky-300 uppercase block">EkSetu Policy Engine</span>
            <div className="flex items-center justify-center space-x-2 text-xs font-bold mt-0.5">
              <span className="text-emerald-300">{policy.totalAllowed} Allowed ✓</span>
              <span>•</span>
              <span className="text-rose-300">{policy.totalBlocked} Blocked ✕</span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-0.5">Purpose Limitation Filter</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />

          {/* Step 3: Released */}
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg w-full sm:w-1/3 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Minimized Response</span>
            <span className="text-base font-black text-emerald-950">{policy.totalAllowed} fields released</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Zero Unnecessary PII</span>
          </div>
        </div>
      </div>

      {/* Allowed vs Blocked Summary Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allowed Fields */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Permitted Information ({policy.totalAllowed})</span>
            </h4>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Released
            </span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {policy.allowedFields.map((field, idx) => (
              <li key={idx} className="flex items-center space-x-2 bg-white/80 p-2 rounded border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-800 text-xs">{getFieldLabel(field)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Blocked Fields */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Protected Information ({policy.totalBlocked})</span>
            </h4>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              Data Minimized
            </span>
          </div>
          {policy.blockedFields.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700">
              {policy.blockedFields.map((bf, idx) => (
                <li key={idx} className="bg-white/80 p-2 rounded border border-rose-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-900 text-xs flex items-center space-x-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>{getFieldLabel(bf.field)}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {humanizeText(bf.classification)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-5">
                    Reason: <strong className="text-rose-700">{humanizeText(bf.reason)}</strong>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No fields were blocked for this request.</p>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between text-xs text-sky-800 font-semibold hover:text-sky-900 transition-colors"
        >
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-700" />
            <span>View Policy Decision & Field Rules Breakdown</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isDetailsOpen && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Service Policy</span>
                <span className="font-bold text-slate-800">{policy.service} ({policy.policyId})</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Policy Engine Version</span>
                <span className="font-bold text-slate-800">Version {policy.version} (Active)</span>
              </div>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="pb-1.5 font-semibold">Attribute</th>
                    <th className="pb-1.5 font-semibold">Classification</th>
                    <th className="pb-1.5 font-semibold">Decision</th>
                    <th className="pb-1.5 font-semibold">Policy Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policy.fieldEvaluations.map((fe, idx) => (
                    <tr key={idx} className="hover:bg-white/60">
                      <td className="py-2 font-medium text-slate-800">
                        {getFieldLabel(fe.field)}
                      </td>
                      <td className="py-2 text-slate-500 uppercase">{humanizeText(fe.classification)}</td>
                      <td className="py-2">
                        {fe.decision === 'ALLOW' ? (
                          <span className="font-bold text-emerald-700">Permitted</span>
                        ) : (
                          <span className="font-bold text-rose-700">Restricted</span>
                        )}
                      </td>
                      <td className="py-2 text-slate-600">{fe.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
