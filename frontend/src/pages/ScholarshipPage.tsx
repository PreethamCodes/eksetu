import React, { useState } from 'react';
import { initiateVerification, submitConsentDecision, fetchAuditTrail, fetchProvenance } from '../services/api';
import {
  ApplicantFormData,
  ConsentPendingResponse,
  VerificationResult
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentResultCard } from '../components/DepartmentResultCard';
import { VerificationProgress } from '../components/VerificationProgress';
import { RequestTrace } from '../components/RequestTrace';
import { ConsentModal } from '../components/ConsentModal';
import { ConsentDetailsCard } from '../components/ConsentDetailsCard';
import { PolicyDecisionCard } from '../components/PolicyDecisionCard';
import { VerificationSources } from '../components/VerificationSources';
import { VerificationTimeline } from '../components/VerificationTimeline';
import { CitizenTransparencyDashboard } from '../components/CitizenTransparencyDashboard';
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  ShieldBan,
  Lock,
  XCircle,
  History,
  Search,
  X,
  Eye
} from 'lucide-react';

const DEFAULT_FORM: ApplicantFormData = {
  applicationId: 'SCH-2026-001',
  name: 'Sai Preetham',
  dob: '2003-05-14',
  qualification: "Bachelor's Degree",
  marksPercentage: 82,
  annualIncome: 180000,
  residenceState: 'Telangana'
};

type DemoScenario =
  | 'data_minimization'
  | 'standard'
  | 'blocked_only'
  | 'revenue_failure'
  | 'education_failure'
  | 'revenue_timeout'
  | 'residence_malformed'
  | 'record_not_found'
  | 'unauthorized_service'
  | 'policy_bypass'
  | 'duplicate_request'
  | 'invalid_request'
  | 'rate_limit';

export const ScholarshipPage: React.FC = () => {
  const [formData, setFormData] = useState<ApplicantFormData>(DEFAULT_FORM);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>('data_minimization');
  const [isInitiating, setIsInitiating] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<ConsentPendingResponse | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // V5 Citizen Transparency Modal state
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);

  // V4 Trace Lookup state
  const [traceLookupOpen, setTraceLookupOpen] = useState(false);
  const [lookupRequestId, setLookupRequestId] = useState('');
  const [lookupRole, setLookupRole] = useState<'CITIZEN' | 'AUDITOR' | 'ADMIN'>('AUDITOR');
  const [lookupApplicantId, setLookupApplicantId] = useState(formData.applicationId);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupAuditData, setLookupAuditData] = useState<{
    requestId: string;
    events: any[];
    provenance: any[];
  } | null>(null);

  const handleLookupTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRequestId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupAuditData(null);
    try {
      const authHeaders = {
        role: lookupRole,
        applicantId: lookupRole === 'CITIZEN' ? (lookupApplicantId.trim() || formData.applicationId) : undefined
      };
      const [auditRes, provRes] = await Promise.all([
        fetchAuditTrail(lookupRequestId.trim(), authHeaders),
        fetchProvenance(lookupRequestId.trim(), authHeaders).catch(() => ({ provenance: [] }))
      ]);
      setLookupAuditData({
        requestId: lookupRequestId.trim(),
        events: auditRes.events,
        provenance: provRes.provenance || []
      });
    } catch (err: any) {
      setLookupError(err.message || 'Failed to lookup request trace');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'annualIncome' || name === 'marksPercentage') ? (value ? Number(value) : 0) : value
    }));
  };

  /**
   * Step 1: Citizen initiates verification -> Gateway creates request in CONSENT_PENDING state
   */
  const handleInitiateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsInitiating(true);

    try {
      let service = 'SCHOLARSHIP';
      let applicantData = { ...formData };
      let requestedData = [
        'studentName',
        'marksPercentage',
        'annualIncome',
        'domicileState'
      ];
      let simulateFailure: any = undefined;

      if (selectedScenario === 'data_minimization') {
        // V3 Primary Showcase: Request 6 fields (including 2 extraneous sensitive fields)
        requestedData = [
          'studentName',
          'marksPercentage',
          'annualIncome',
          'domicileState',
          'bankBalance',
          'fullAddress'
        ];
      } else if (selectedScenario === 'blocked_only') {
        // Test 4: Request ONLY blocked fields
        requestedData = ['bankBalance', 'fullAddress'];
      } else if (selectedScenario === 'revenue_failure') {
        simulateFailure = { department: 'revenue', failureType: 'FAILURE', reason: 'Simulated department registry outage / expired certificate demo' };
      } else if (selectedScenario === 'education_failure') {
        simulateFailure = { department: 'education', failureType: 'FAILURE', reason: 'Candidate academic record not found in Education database' };
      } else if (selectedScenario === 'revenue_timeout') {
        simulateFailure = { department: 'revenue', failureType: 'TIMEOUT', reason: 'Revenue Gateway 5000ms network timeout simulation' };
      } else if (selectedScenario === 'residence_malformed') {
        simulateFailure = { department: 'residence', failureType: 'MALFORMED_RESPONSE', reason: 'Residence provider returned non-conforming data structure' };
      } else if (selectedScenario === 'record_not_found') {
        simulateFailure = { department: 'education', failureType: 'RECORD_NOT_FOUND', reason: 'Applicant academic record not found in registry' };
      } else if (selectedScenario === 'unauthorized_service') {
        service = 'UNREGISTERED_COMMERCIAL_LOAN';
      } else if (selectedScenario === 'policy_bypass') {
        requestedData = ['studentName', 'bankBalance', 'propertyDetails'];
      } else if (selectedScenario === 'invalid_request') {
        applicantData.name = ''; // Trigger 400 validation error
      } else if (selectedScenario === 'rate_limit') {
        // Trigger rapid requests to test 429 rate limiter
        for (let i = 0; i < 4; i++) {
          await initiateVerification({
            service: 'SCHOLARSHIP',
            applicant: formData,
            requestedData: ['studentName']
          });
        }
      }

      const payload = {
        service,
        applicant: applicantData,
        requestedData,
        purpose: 'Scholarship Eligibility',
        simulateFailure
      };

      const pendingRes = await initiateVerification(payload);
      setPendingConsent(pendingRes);
      setIsInitiating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate verification request');
      setIsInitiating(false);
    }
  };

  /**
   * Step 2: Citizen chooses ALLOW or DENY on the Consent Screen
   */
  const handleConsentDecision = async (decision: 'ALLOW' | 'DENY') => {
    if (!pendingConsent) return;
    setIsSubmittingConsent(true);
    setError(null);

    try {
      if (decision === 'ALLOW') {
        setIsOrchestrating(true);
      }

      const result = await submitConsentDecision({
        requestId: pendingConsent.requestId,
        decision
      });

      // If duplicate request scenario is selected, immediately replay consent to demonstrate 409 conflict
      if (selectedScenario === 'duplicate_request') {
        try {
          await submitConsentDecision({
            requestId: pendingConsent.requestId,
            decision
          });
        } catch (dupErr: any) {
          setError(`[Security Check: Duplicate Replay Detected] ${dupErr.message}`);
        }
      }

      if (decision === 'ALLOW') {
        // Stepper animation runs for visual clarity in SIH demo
        setTimeout(() => {
          setVerificationResult(result);
          setPendingConsent(null);
          setIsSubmittingConsent(false);
          setIsOrchestrating(false);
        }, 3200);
      } else {
        // Immediate denial transition
        setVerificationResult(result);
        setPendingConsent(null);
        setIsSubmittingConsent(false);
        setIsOrchestrating(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process consent decision');
      setIsSubmittingConsent(false);
      setIsOrchestrating(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
    setPendingConsent(null);
    setVerificationResult(null);
    setError(null);
    setIsInitiating(false);
    setIsSubmittingConsent(false);
    setIsOrchestrating(false);
  };

  const isConsentDenied = verificationResult?.status === 'CONSENT_DENIED';
  const isPolicyDenied = verificationResult?.status === 'POLICY_DENIED';

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
                  EKSetu V3 Policy & Minimization
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2642] tracking-tight mt-0.5">
                National Merit Scholarship Scheme 2026
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fictional demo service demonstrating citizen consent, policy engine evaluation, and data minimization.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end space-y-2">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                Application ID
              </span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {formData.applicationId}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowTransparencyModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>My Data Usage (V5)</span>
              </button>
              <button
                type="button"
                onClick={() => setTraceLookupOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <History className="w-3.5 h-3.5" />
                <span>Trace Request by ID</span>
              </button>
            </div>
          </div>
        </div>

        {/* Demo Scenario Controller */}
        <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-medium">
            <Sliders className="w-4 h-4 text-sky-700" />
            <span className="font-bold">EKSetu V6 Security & Demo Scenarios:</span>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value as any)}
              disabled={isInitiating || pendingConsent !== null || isOrchestrating || verificationResult !== null}
              className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
            >
              <optgroup label="V3/V4 Baseline Scenarios">
                <option value="data_minimization">
                  Data Minimization (6 Requested → 4 Allowed, 2 Blocked)
                </option>
                <option value="standard">
                  Standard Verification (All Providers Succeed)
                </option>
                <option value="blocked_only">
                  Only Blocked Fields (POLICY_DENIED)
                </option>
              </optgroup>
              <optgroup label="V6 Provider Failure & Resilience">
                <option value="education_failure">
                  Education Provider Failure (Education FAILED → PARTIAL_VERIFIED)
                </option>
                <option value="revenue_failure">
                  Revenue Provider Failure (Revenue FAILED → PARTIAL_VERIFIED)
                </option>
                <option value="revenue_timeout">
                  Provider Timeout (Revenue Gateway 5s Timeout)
                </option>
                <option value="residence_malformed">
                  Malformed Provider Response (Residence Contract Violation)
                </option>
                <option value="record_not_found">
                  Record Not Found (Education Registry Missing Record)
                </option>
              </optgroup>
              <optgroup label="V6 Security & Abuse Protection">
                <option value="unauthorized_service">
                  Unauthorized Service (403 AUTHORIZATION_FAILED)
                </option>
                <option value="policy_bypass">
                  Policy Bypass Attempt (Server Ignores Client allowedFields)
                </option>
                <option value="duplicate_request">
                  Duplicate Request / Replay (409 Conflict)
                </option>
                <option value="invalid_request">
                  Invalid Request Body (400 INVALID_REQUEST)
                </option>
                <option value="rate_limit">
                  Rate Limiting Test (Rapid Requests → 429 RATE_LIMITED)
                </option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* STAGE 1: Application Form */}
      {!verificationResult && !isOrchestrating && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#0F2642]">Applicant Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review or edit applicant details below before initiating automated verification via EKSetu.
            </p>
          </div>

          <form onSubmit={handleInitiateVerification} className="space-y-6">
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
                <span className="font-bold">Citizen Consent & Policy Governed:</span> In accordance with V3 privacy-by-design standards, EKSetu prompts you for explicit consent and passes your request through the <strong>EKSetu Policy Engine</strong>, ensuring unneeded fields (such as bank balance or medical records) are automatically blocked.
              </div>
            </div>

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isInitiating}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-60"
              >
                {isInitiating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                    <span>Initiating Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                    <span>Verify with EKSetu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAGE 2: Citizen Consent Modal Screen */}
      {pendingConsent && !isOrchestrating && (
        <ConsentModal
          consentData={pendingConsent}
          onDecision={handleConsentDecision}
          submitting={isSubmittingConsent}
        />
      )}

      {/* STAGE 3A: Orchestration Loading Progress (when ALLOW chosen) */}
      {isOrchestrating && (
        <VerificationProgress />
      )}

      {/* STAGE 4A: Outcome - CONSENT DENIED */}
      {isConsentDenied && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rose-100 gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                      Access Refused
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[#0F2642]">
                    Consent Denied
                  </h3>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    Your information was not shared.
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No government department data was retrieved through EKSetu for this request.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Request Status</span>
                <StatusBadge status="CONSENT_DENIED" size="lg" />
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Request ID: <span className="font-bold text-[#0F2642]">{verificationResult?.requestId}</span>
                </div>
              </div>
            </div>

            {/* Empty Department Table / Demonstration of Non-Release */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Department Registries Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-bold text-slate-500">Education Department</div>
                  <div className="text-sm font-bold text-slate-400 mt-2">— (Not Retrieved)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Access blocked by citizen denial</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-bold text-slate-500">Revenue Department</div>
                  <div className="text-sm font-bold text-slate-400 mt-2">— (Not Retrieved)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Access blocked by citizen denial</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-bold text-slate-500">Residence Department</div>
                  <div className="text-sm font-bold text-slate-400 mt-2">— (Not Retrieved)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Access blocked by citizen denial</div>
                </div>
              </div>
            </div>

            {/* Consent Metadata Record */}
            <ConsentDetailsCard
              consent={verificationResult?.consent}
              requestId={verificationResult?.requestId || ''}
              consentDecision="DENIED"
            />

            {/* V4 Provenance Card */}
            <div className="mt-6">
              <VerificationSources
                provenance={verificationResult?.provenance}
                dataReleased={false}
              />
            </div>

            {/* V4 Audit Trail Timeline */}
            <div className="mt-6">
              <VerificationTimeline
                events={verificationResult?.auditEvents}
                requestId={verificationResult?.requestId}
              />
            </div>

            {/* Request Trace */}
            {verificationResult?.trace && (
              <RequestTrace
                trace={verificationResult.trace}
                requestId={verificationResult.requestId}
              />
            )}

            {/* Return Action */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                You may re-apply or choose manual physical verification where permitted.
              </span>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4B: Outcome - POLICY DENIED (e.g. only blocked fields requested) */}
      {isPolicyDenied && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rose-100 gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                  <ShieldBan className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                      Policy Enforcement
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[#0F2642]">
                    Policy Denied — Data Minimization Block
                  </h3>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    All requested fields were rejected by EKSetu Policy Engine.
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Zero government department data was released because the requested fields are not authorized for purpose 'Scholarship Eligibility'.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase">Request Status</span>
                <StatusBadge status="POLICY_DENIED" size="lg" />
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Request ID: <span className="font-bold text-[#0F2642]">{verificationResult?.requestId}</span>
                </div>
              </div>
            </div>

            {/* Policy Evaluation Details */}
            {verificationResult?.policy && (
              <div className="mt-6">
                <PolicyDecisionCard policy={verificationResult.policy} />
              </div>
            )}

            {/* V4 Provenance Card */}
            <div className="mt-6">
              <VerificationSources
                provenance={verificationResult?.provenance}
                dataReleased={false}
              />
            </div>

            {/* V4 Audit Trail Timeline */}
            <div className="mt-6">
              <VerificationTimeline
                events={verificationResult?.auditEvents}
                requestId={verificationResult?.requestId}
              />
            </div>

            {/* Request Trace */}
            {verificationResult?.trace && (
              <RequestTrace
                trace={verificationResult.trace}
                requestId={verificationResult.requestId}
              />
            )}

            {/* Return Action */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                The requesting service exceeded authorized purpose boundaries.
              </span>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-[#0F2642] hover:bg-[#1A4472] text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4C: Outcome - VERIFICATION COMPLETE (ALLOW / PARTIAL_ALLOW) */}
      {verificationResult && !isConsentDenied && !isPolicyDenied && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {verificationResult.status === 'PARTIAL_VERIFIED'
                      ? 'Incomplete Department Outcome'
                      : 'Orchestrated Verification Outcome'}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#0F2642]">
                  {verificationResult.status === 'PARTIAL_VERIFIED'
                    ? 'Partial Verification (Some Departments Incomplete)'
                    : verificationResult.status === 'VERIFICATION_FAILED'
                    ? 'Department Verification Failed'
                    : 'Verification Complete'}
                </h3>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-600">
                  <span>Applicant: <strong className="text-slate-800">{verificationResult.applicant?.name || formData.name}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>App ID: <strong className="font-mono text-slate-800">{verificationResult.applicant?.applicationId || formData.applicationId}</strong></span>
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

            {/* V3 Key Feature: Policy Decision & Data Minimization Card */}
            {verificationResult.policy && (
              <div className="mt-6">
                <PolicyDecisionCard policy={verificationResult.policy} />
              </div>
            )}

            {/* Section 13: Accurate Verification Result & Data Breakdown */}
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verification Result & Data Minimization Summary
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Authoritative Department APIs
                </span>
              </div>

              {/* Department Verification Status Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {/* Education */}
                <div className={`flex items-center space-x-2.5 p-3 rounded-lg border bg-white ${
                  verificationResult.sources?.find(s => s.department === 'Education Department')?.status === 'VERIFIED'
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/20'
                }`}>
                  {verificationResult.sources?.find(s => s.department === 'Education Department')?.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Education Department</span>
                    <span className={`text-[11px] font-semibold ${
                      verificationResult.sources?.find(s => s.department === 'Education Department')?.status === 'VERIFIED'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {verificationResult.sources?.find(s => s.department === 'Education Department')?.status === 'VERIFIED'
                        ? '✓ Education verified'
                        : '✗ Education unverified'}
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <div className={`flex items-center space-x-2.5 p-3 rounded-lg border bg-white ${
                  verificationResult.sources?.find(s => s.department === 'Revenue Department')?.status === 'VERIFIED'
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/20'
                }`}>
                  {verificationResult.sources?.find(s => s.department === 'Revenue Department')?.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Revenue Department</span>
                    <span className={`text-[11px] font-semibold ${
                      verificationResult.sources?.find(s => s.department === 'Revenue Department')?.status === 'VERIFIED'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {verificationResult.sources?.find(s => s.department === 'Revenue Department')?.status === 'VERIFIED'
                        ? '✓ Income verified'
                        : '✗ Income unverified'}
                    </span>
                  </div>
                </div>

                {/* Residence */}
                <div className={`flex items-center space-x-2.5 p-3 rounded-lg border bg-white ${
                  verificationResult.sources?.find(s => s.department === 'Residence Department')?.status === 'VERIFIED'
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/20'
                }`}>
                  {verificationResult.sources?.find(s => s.department === 'Residence Department')?.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Residence Department</span>
                    <span className={`text-[11px] font-semibold ${
                      verificationResult.sources?.find(s => s.department === 'Residence Department')?.status === 'VERIFIED'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {verificationResult.sources?.find(s => s.department === 'Residence Department')?.status === 'VERIFIED'
                        ? '✓ Residence verified'
                        : '✗ Residence unverified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Shared vs Data Blocked */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                {/* Data Shared */}
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Data Shared (Permitted by Policy)</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <span className="text-slate-600 font-medium">Student Name</span>
                      <span className="font-bold text-slate-900">{verificationResult.data?.studentName || formData.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <span className="text-slate-600 font-medium">Marks Percentage</span>
                      <span className="font-bold text-slate-900">{verificationResult.data?.marksPercentage ?? 82}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <span className="text-slate-600 font-medium">Annual Income</span>
                      <span className="font-bold text-slate-900">₹{(verificationResult.data?.annualIncome ?? formData.annualIncome).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <span className="text-slate-600 font-medium">Domicile State</span>
                      <span className="font-bold text-slate-900">{verificationResult.data?.domicileState || formData.residenceState}</span>
                    </div>
                  </div>
                </div>

                {/* Data Blocked */}
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider mb-2.5">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>Data Blocked (Data Minimization)</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Bank Balance</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded">BLOCKED</span>
                      </div>
                      <span className="text-[11px] text-rose-700 block mt-1 font-medium">Reason: Excessive data</span>
                    </div>
                    <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Full Address</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded">BLOCKED</span>
                      </div>
                      <span className="text-[11px] text-rose-700 block mt-1 font-medium">Reason: Not required for scholarship eligibility</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Source Cards Grid (Released Allowed Data) */}
            <div className="mt-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Authoritative Department Source Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Education Department Card */}
                <DepartmentResultCard
                  type="education"
                  departmentName="Education Department"
                  fieldLabel="Academic Qualification"
                  fieldValue={verificationResult.verifiedData?.education?.qualification || formData.qualification}
                  status={verificationResult.verifiedData?.education?.status || 'FAILED'}
                  source="Education Department"
                  verifiedAt={verificationResult.sources?.find(s => s.department === 'Education Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData?.education?.studentStatus ? `Registry Status: ${verificationResult.verifiedData.education.studentStatus}` : undefined}
                />

                {/* 2. Revenue Department Card */}
                <DepartmentResultCard
                  type="income"
                  departmentName="Revenue Department"
                  fieldLabel="Annual Family Income"
                  fieldValue={verificationResult.verifiedData?.income?.annualIncome ?? formData.annualIncome}
                  status={verificationResult.verifiedData?.income?.status || 'FAILED'}
                  source="Revenue Department"
                  verifiedAt={verificationResult.sources?.find(s => s.department === 'Revenue Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData?.income?.incomeStatus ? `Certificate Status: ${verificationResult.verifiedData.income.incomeStatus}` : undefined}
                />

                {/* 3. Residence Department Card */}
                <DepartmentResultCard
                  type="residence"
                  departmentName="Residence Department"
                  fieldLabel="State Domicile"
                  fieldValue={verificationResult.verifiedData?.residence?.state || formData.residenceState}
                  status={verificationResult.verifiedData?.residence?.status || 'FAILED'}
                  source="Residence Department"
                  verifiedAt={verificationResult.sources?.find(s => s.department === 'Residence Department')?.verifiedAt}
                  extraDetails={verificationResult.verifiedData?.residence?.residenceStatus ? `Domicile Record: ${verificationResult.verifiedData.residence.residenceStatus}` : undefined}
                />
              </div>
            </div>

            {/* Blocked Information (Protected by Policy) */}
            {verificationResult.policy && verificationResult.policy.blockedFields.length > 0 && (
              <div className="mt-8 p-5 bg-rose-50/50 border border-rose-200 rounded-xl">
                <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs uppercase tracking-wider mb-2">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Protected Information (Blocked by EKSetu Policy Engine)</span>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  The requesting service declared these fields in its request, but EKSetu verified they are not required for Scholarship Eligibility and blocked them from release:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {verificationResult.policy.blockedFields.map((bf, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-lg border border-rose-200 flex items-start space-x-3">
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 font-mono">{bf.field}</span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-1.5 py-0.5 rounded">
                            BLOCKED
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Classification: <strong className="text-slate-700">{bf.classification}</strong>
                        </span>
                        <span className="text-[11px] text-rose-700 block mt-0.5 font-medium">
                          Reason: {bf.reason.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consent Details Card */}
            <ConsentDetailsCard
              consent={verificationResult.consent}
              requestId={verificationResult.requestId}
              consentDecision="GRANTED"
            />

            {/* V4 Authoritative Data Provenance Table */}
            <div className="mt-8">
              <VerificationSources
                provenance={verificationResult.provenance}
                dataReleased={verificationResult.dataReleased}
              />
            </div>

            {/* V4 Verification Audit Trail Timeline */}
            <div className="mt-8">
              <VerificationTimeline
                events={verificationResult.auditEvents}
                requestId={verificationResult.requestId}
              />
            </div>

            {/* Request Trace Expandable */}
            {verificationResult.trace && (
              <RequestTrace
                trace={verificationResult.trace}
                requestId={verificationResult.requestId}
              />
            )}

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Only minimized verified attributes released to Scholarship Application {formData.applicationId}</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowTransparencyModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Citizen Transparency View</span>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Test Another Scenario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* V4 Request ID Trace Lookup Modal */}
      {traceLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F2642]">Audit Trail & Provenance Trace</h3>
                  <p className="text-xs text-slate-500">Inspect the complete lifecycle and data provenance of any Request ID</p>
                </div>
              </div>
              <button
                onClick={() => setTraceLookupOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleLookupTrace} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Demo Role (Server-Validated)
                    </label>
                    <select
                      value={lookupRole}
                      onChange={e => setLookupRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="AUDITOR">Auditor (Full Trace Access)</option>
                      <option value="ADMIN">Admin (Operations Access)</option>
                      <option value="CITIZEN">Citizen (Own Request Only)</option>
                    </select>
                  </div>

                  {lookupRole === 'CITIZEN' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Citizen Application ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SCH-2026-001"
                        value={lookupApplicantId}
                        onChange={e => setLookupApplicantId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-slate-500 pt-5">
                      <span>Auditors and Admins have institutional oversight authorization.</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter Request ID (e.g. REQ-20260930-XXXXX)..."
                      value={lookupRequestId}
                      onChange={e => setLookupRequestId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading || !lookupRequestId.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm disabled:opacity-60 flex items-center space-x-1.5 transition-colors"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Trace</span>
                    )}
                  </button>
                </div>
              </form>

              {lookupError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{lookupError}</span>
                </div>
              )}

              {lookupAuditData && (
                <div className="space-y-6">
                  {/* Provenance */}
                  <VerificationSources
                    provenance={lookupAuditData.provenance}
                    dataReleased={lookupAuditData.provenance.length > 0}
                  />

                  {/* Audit Timeline */}
                  <VerificationTimeline
                    events={lookupAuditData.events}
                    requestId={lookupAuditData.requestId}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* V5 Citizen Transparency & Data Usage Dashboard Modal */}
      {showTransparencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <CitizenTransparencyDashboard
              currentApplicantId={formData.applicationId}
              initialRequestId={verificationResult?.requestId}
              onClose={() => setShowTransparencyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
