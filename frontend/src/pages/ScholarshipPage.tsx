import React, { useState } from 'react';
import { submitVerificationRequest } from '../services/api';
import { ApplicantFormData, VerificationResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentResultCard } from '../components/DepartmentResultCard';
import { VerificationProgress } from '../components/VerificationProgress';
import { RequestTrace } from '../components/RequestTrace';
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const DEFAULT_FORM: ApplicantFormData = {
  applicationId: 'SCH-2026-001',
  name: 'Sai Preetham',
  dob: '2003-05-14',
  qualification: "Bachelor's Degree",
  annualIncome: 180000,
  residenceState: 'Telangana'
};

export const ScholarshipPage: React.FC = () => {
  const [formData, setFormData] = useState<ApplicantFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedFailureDept, setSimulatedFailureDept] = useState<'none' | 'education' | 'revenue' | 'residence'>('none');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'annualIncome' ? (value ? Number(value) : 0) : value
    }));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        service: 'SCHOLARSHIP',
        applicant: formData,
        requestedData: ['education', 'income', 'residence'],
        simulateFailure: simulatedFailureDept !== 'none' ? {
          department: simulatedFailureDept,
          reason: 'Simulated department registry outage / expired certificate demo'
        } : undefined
      };

      // Call EKSetu Interoperability Gateway API
      const result = await submitVerificationRequest(payload);

      // Short delay to allow visual completion of the orchestration steps
      setTimeout(() => {
        setVerificationResult(result);
        setLoading(false);
      }, 2800);
    } catch (err: any) {
      setError(err.message || 'Verification request failed');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
    setVerificationResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Service Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-sky-50 text-sky-800 rounded-xl border border-sky-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                  Government Service Portal
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  EKSetu Enabled
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2642] tracking-tight mt-0.5">
                National Merit Scholarship Scheme 2026
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fictional demo service demonstrating seamless cross-departmental interoperability.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              Application ID
            </span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {formData.applicationId}
            </span>
          </div>
        </div>

        {/* Demo Scenario Controller */}
        <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            <Sliders className="w-4 h-4 text-sky-700" />
            <span>SIH Demo Scenario:</span>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={simulatedFailureDept}
              onChange={e => setSimulatedFailureDept(e.target.value as any)}
              disabled={loading || verificationResult !== null}
              className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
            >
              <option value="none">Normal Verification (All 3 Departments Succeed)</option>
              <option value="revenue">Simulate Revenue Department Failure (Partial Verification)</option>
              <option value="education">Simulate Education Registry Mismatch</option>
              <option value="residence">Simulate Residence Registry Timeout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Flow: Form vs Results */}
      {!verificationResult && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#0F2642]">Applicant Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review or edit applicant details below before requesting automated verification via EKSetu.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Application ID
                </label>
                <input
                  type="text"
                  name="applicationId"
                  value={formData.applicationId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Education Qualification
                </label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                >
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Diploma in Engineering">Diploma in Engineering</option>
                  <option value="Higher Secondary (12th)">Higher Secondary (12th)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Income (₹)
                </label>
                <input
                  type="number"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Residence State
                </label>
                <select
                  name="residenceState"
                  value={formData.residenceState}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                >
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Interoperability Callout Banner */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-sky-900">
              <Sparkles className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Zero Paperwork Interoperability:</span> Clicking below will not upload documents. Instead, EKSetu will securely orchestrate verification directly across the Education, Revenue, and Residence department registries.
              </div>
            </div>

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3"
              >
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <span>Verify Automatically with EKSetu</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Progress State */}
      {loading && (
        <VerificationProgress />
      )}

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Result Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Orchestrated Verification Outcome
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#0F2642]">
                  Verification Complete
                </h3>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-600">
                  <span>Applicant: <strong className="text-slate-800">{verificationResult.applicant.name}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>App ID: <strong className="font-mono text-slate-800">{verificationResult.applicant.applicationId}</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Overall Status</span>
                <StatusBadge status={verificationResult.status} size="lg" />
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Request ID: <span className="font-bold text-[#0F2642]">{verificationResult.requestId}</span>
                </div>
              </div>
            </div>

            {/* Department Source Cards Grid */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Verified Department Data Sources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Education Department Card */}
                <DepartmentResultCard
                  type="education"
                  departmentName="Education Department"
                  fieldLabel="Academic Qualification"
                  fieldValue={verificationResult.verifiedData.education?.qualification || formData.qualification}
                  status={verificationResult.verifiedData.education?.status || 'FAILED'}
                  source="Education Department"
                  verifiedAt={verificationResult.sources.find(s => s.department === 'Education Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData.education?.studentStatus ? `Registry Status: ${verificationResult.verifiedData.education.studentStatus}` : undefined}
                />

                {/* 2. Revenue Department Card */}
                <DepartmentResultCard
                  type="income"
                  departmentName="Revenue Department"
                  fieldLabel="Annual Family Income"
                  fieldValue={verificationResult.verifiedData.income?.annualIncome ?? formData.annualIncome}
                  status={verificationResult.verifiedData.income?.status || 'FAILED'}
                  source="Revenue Department"
                  verifiedAt={verificationResult.sources.find(s => s.department === 'Revenue Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData.income?.incomeStatus ? `Certificate Status: ${verificationResult.verifiedData.income.incomeStatus}` : undefined}
                />

                {/* 3. Residence Department Card */}
                <DepartmentResultCard
                  type="residence"
                  departmentName="Residence Department"
                  fieldLabel="State Domicile"
                  fieldValue={verificationResult.verifiedData.residence?.state || formData.residenceState}
                  status={verificationResult.verifiedData.residence?.status || 'FAILED'}
                  source="Residence Department"
                  verifiedAt={verificationResult.sources.find(s => s.department === 'Residence Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData.residence?.residenceStatus ? `Domicile Record: ${verificationResult.verifiedData.residence.residenceStatus}` : undefined}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified attributes are securely bound to Scholarship Application {formData.applicationId}</span>
              </div>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset / Test Another Record</span>
              </button>
            </div>
          </div>

          {/* Request Trace Expandable */}
          <RequestTrace
            trace={verificationResult.trace}
            requestId={verificationResult.requestId}
          />
        </div>
      )}
    </div>
  );
};
