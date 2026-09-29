import React from 'react';
import { ArrowRight, FileCheck, Layers, Landmark, GraduationCap, Home, ShieldCheck, Filter } from 'lucide-react';

interface LandingPageProps {
  onNavigateToScholarship: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToScholarship }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-6 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
        <span>V3 PROTOTYPE — POLICY ENGINE & DATA MINIMIZATION LAYER</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-black text-[#0F2642] tracking-tight leading-tight">
          Connecting Government Services Through Secure Interoperability
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          EKSetu enables government services to access verified information from multiple departments through a unified interoperability layer — governed by citizen consent, verified service authorization, and purpose-bound data minimization.
        </p>
        <p className="mt-2 text-sm text-sky-800 font-semibold italic">
          "Share Proof, Not Databases."
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={onNavigateToScholarship}
            className="px-6 py-3 rounded-lg bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <span>Try Scholarship Verification (V3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500">
            Interactive V3 prototype with live Policy Engine data minimization
          </span>
        </div>
      </div>

      {/* Key Architectural Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F2642]">3 Departments</div>
            <p className="text-xs text-slate-500 mt-1">
              Education, Revenue, and Residence registries queried simultaneously.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F2642]">Policy Engine</div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluates field-level permissions and blocks unneeded attributes.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F2642]">Data Minimized</div>
            <p className="text-xs text-slate-500 mt-1">
              Only required verified proof is released to the requesting service.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Flow Diagram */}
      <div className="mt-14 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F2642] mb-2">
          V3 Interoperability, Consent & Policy Architecture
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          The citizen stays in their target service. EKSetu verifies consent, evaluates purpose-bound policies, and strips extraneous data before release.
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          {/* Step 1 */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 w-full lg:w-40 shadow-sm">
            <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">
              Service
            </div>
            <div className="font-bold text-xs text-[#0F2642]">Scholarship Portal</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Requests 5 attributes</p>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 lg:rotate-0 flex-shrink-0" />

          {/* Step 2 - Consent */}
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg w-full lg:w-40 shadow-sm">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consent</span>
            </div>
            <div className="font-bold text-xs text-emerald-950">Citizen ALLOW</div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Permits request to proceed</p>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 lg:rotate-0 flex-shrink-0" />

          {/* Step 3 - Policy Engine */}
          <div className="bg-[#0F2642] text-white p-3 rounded-lg w-full lg:w-48 shadow-md border border-slate-700">
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider mb-0.5 flex items-center justify-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Policy Engine</span>
            </div>
            <div className="font-bold text-xs">3 Allowed | 2 Blocked</div>
            <p className="text-[10px] text-slate-300 mt-0.5">Blocks bank & medical data</p>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 lg:rotate-0 flex-shrink-0" />

          {/* Step 4 - Department Registries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full lg:w-72">
            <div className="bg-white p-2 rounded border border-slate-200 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-sky-700 mx-auto mb-0.5" />
              <div className="font-bold text-slate-800 text-[10px]">Education</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-xs">
              <Landmark className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-0.5" />
              <div className="font-bold text-slate-800 text-[10px]">Revenue</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-xs">
              <Home className="w-3.5 h-3.5 text-indigo-700 mx-auto mb-0.5" />
              <div className="font-bold text-slate-800 text-[10px]">Residence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
