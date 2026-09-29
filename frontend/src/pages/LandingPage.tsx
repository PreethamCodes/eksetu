import React from 'react';
import { ArrowRight, GitMerge, FileCheck, Layers, Landmark, GraduationCap, Home } from 'lucide-react';

interface LandingPageProps {
  onNavigateToScholarship: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToScholarship }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-6 border border-sky-200">
        <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
        <span>V1 PROTOTYPE / DEMONSTRATION PLATFORM</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-black text-[#0F2642] tracking-tight leading-tight">
          Connecting Government Services Through Secure Interoperability
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          EKSetu enables government services to access verified information from multiple departments through a unified interoperability layer — without centralizing or duplicating citizen databases.
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
            <span>Try Scholarship Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500">
            Interactive V1 prototype demonstration
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
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F2642]">1 Interoperability Layer</div>
            <p className="text-xs text-slate-500 mt-1">
              EKSetu orchestrates discovery, request validation, and provenance.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F2642]">1 Verified Result</div>
            <p className="text-xs text-slate-500 mt-1">
              Clean aggregated proof delivered back to the requesting service.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Flow Diagram */}
      <div className="mt-14 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F2642] mb-2">
          V1 Interoperability Architecture
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          The citizen stays in their target service. EKSetu routes data without copying entire databases.
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          {/* Step 1 */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 w-full lg:w-48 shadow-sm">
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
              Service
            </div>
            <div className="font-bold text-sm text-[#0F2642]">Scholarship Portal</div>
            <p className="text-[11px] text-slate-500 mt-1">Applicant submits verification request</p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

          {/* Step 2 */}
          <div className="bg-[#0F2642] text-white p-4 rounded-lg w-full lg:w-56 shadow-md border border-slate-700">
            <div className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-1">
              Gateway
            </div>
            <div className="font-bold text-sm">EKSetu Core</div>
            <p className="text-[11px] text-slate-300 mt-1">Routes & orchestrates department providers</p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

          {/* Step 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-96">
            <div className="bg-white p-2.5 rounded border border-slate-200 text-xs">
              <GraduationCap className="w-4 h-4 text-sky-700 mx-auto mb-1" />
              <div className="font-bold text-slate-800 text-[11px]">Education Dept</div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-xs">
              <Landmark className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
              <div className="font-bold text-slate-800 text-[11px]">Revenue Dept</div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-xs">
              <Home className="w-4 h-4 text-indigo-700 mx-auto mb-1" />
              <div className="font-bold text-slate-800 text-[11px]">Residence Dept</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
