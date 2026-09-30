import React, { useState, useEffect } from 'react';
import {
  fetchCitizenRequests,
  fetchCitizenRequestDetail
} from '../services/api';
import {
  CitizenRequestSummary,
  CitizenTransparencyView
} from '../types';
import {
  ShieldCheck,
  Eye,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Clock,
  Search,
  RefreshCw,
  Info,
  ShieldBan,
  Share2
} from 'lucide-react';

interface CitizenTransparencyDashboardProps {
  currentApplicantId?: string;
  initialRequestId?: string;
  onClose?: () => void;
}

export const CitizenTransparencyDashboard: React.FC<CitizenTransparencyDashboardProps> = ({
  currentApplicantId = 'SCH-2026-001',
  initialRequestId,
  onClose
}) => {
  const [applicantId, setApplicantId] = useState<string>(currentApplicantId);
  const [requests, setRequests] = useState<CitizenRequestSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(initialRequestId || null);
  const [transparencyData, setTransparencyData] = useState<CitizenTransparencyView | null>(null);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Load applicant requests
  const loadRequests = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoadingRequests(true);
    setError(null);
    try {
      const res = await fetchCitizenRequests(idToFetch.trim());
      setRequests(res.requests || []);
      if (res.requests && res.requests.length > 0) {
        // If no selected request, or previous selected not in list, select the latest
        if (!selectedRequestId || !res.requests.some(r => r.requestId === selectedRequestId)) {
          setSelectedRequestId(res.requests[0].requestId);
        }
      } else {
        setSelectedRequestId(null);
        setTransparencyData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load citizen verification requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load detail whenever selectedRequestId changes
  const loadDetail = async (reqId: string, citizenId: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const data = await fetchCitizenRequestDetail(reqId, citizenId);
      setTransparencyData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve transparency report for this request');
      setTransparencyData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadRequests(applicantId);
  }, []);

  useEffect(() => {
    if (selectedRequestId && applicantId) {
      loadDetail(selectedRequestId, applicantId);
    }
  }, [selectedRequestId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests(applicantId);
  };

  const filteredRequests = requests.filter(r =>
    r.requestId.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.purpose.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2642] to-[#1E3A8A] text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Eye className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                  Citizen Portal
                </span>
                <span className="text-white/40">|</span>
                <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                  V5 Data Usage Visibility
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                My Data Usage & Transparency Dashboard
              </h2>
              <p className="text-xs text-sky-100/80 mt-1 max-w-xl">
                See exactly what information was requested, what was approved by policy, which government departments were consulted, and what data was actually shared.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-start sm:self-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/20"
            >
              Close Dashboard
            </button>
          )}
        </div>

        {/* Applicant Identity Switcher & Refresh */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-wrap">
            <span className="text-sky-200 font-medium">Viewing data for Citizen ID:</span>
            <input
              type="text"
              value={applicantId}
              onChange={(e) => setApplicantId(e.target.value)}
              className="bg-white/10 text-white placeholder-sky-200/50 border border-white/20 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300 font-mono"
              placeholder="e.g. SCH-2026-001"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded font-bold transition-colors"
            >
              Apply
            </button>
          </form>

          <button
            onClick={() => loadRequests(applicantId)}
            disabled={loadingRequests}
            className="flex items-center space-x-1.5 text-sky-200 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
            <span>Refresh Requests</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-200">
        {/* Left Column: Request History List (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 p-5 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Request History ({requests.length})
              </h3>
            </div>
          </div>

          {/* Filter box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by ID or status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {loadingRequests ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center">
              <RefreshCw className="w-5 h-5 animate-spin mb-2" />
              Loading citizen request history...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-200 p-4">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium">No verification requests found</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Submit a scholarship verification form to view transparency details.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredRequests.map((req) => {
                const isSelected = req.requestId === selectedRequestId;
                const isDenied = req.status === 'CONSENT_DENIED' || req.status === 'POLICY_DENIED';
                const isPartial = req.status === 'PARTIAL_VERIFIED';
                const isVerified = req.status === 'VERIFIED';

                return (
                  <div
                    key={req.requestId}
                    onClick={() => setSelectedRequestId(req.requestId)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-300 shadow-sm ring-1 ring-sky-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[170px]">
                        {req.requestId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isDenied
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isVerified
                          ? 'Verified'
                          : isPartial
                          ? 'Partial Verification'
                          : req.status === 'CONSENT_DENIED'
                          ? 'Consent Denied'
                          : req.status === 'POLICY_DENIED'
                          ? 'Policy Denied'
                          : req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium mb-1 truncate">
                      {req.purpose}
                    </div>

                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {req.statusExplanation}
                    </p>

                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      {new Date(req.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Transparency Report (8 cols) */}
        <div className="lg:col-span-8 p-6 space-y-6">
          {loadingDetail ? (
            <div className="py-24 text-center text-slate-400 text-sm flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-sky-600" />
              Fetching verified transparency report...
            </div>
          ) : !transparencyData ? (
            <div className="py-24 text-center text-slate-400">
              <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Select a verification request</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Choose a request from the history list to inspect its data minimization, policy decisions, and department sources.
              </p>
            </div>
          ) : (
            <>
              {/* Request Status Overview Banner */}
              <div
                className={`p-5 rounded-2xl border ${
                  transparencyData.status === 'VERIFIED'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : transparencyData.status === 'PARTIAL_VERIFIED'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : transparencyData.status === 'CONSENT_DENIED'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 ${
                        transparencyData.status === 'VERIFIED'
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : transparencyData.status === 'PARTIAL_VERIFIED'
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : transparencyData.status === 'CONSENT_DENIED'
                          ? 'bg-rose-100 border-rose-300 text-rose-700'
                          : 'bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {transparencyData.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : transparencyData.status === 'PARTIAL_VERIFIED' ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <ShieldBan className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {transparencyData.requestId}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {transparencyData.serviceName}
                        </span>
                      </div>
                      <h4 className="text-lg font-black tracking-tight mt-0.5">
                        {transparencyData.status === 'VERIFIED'
                          ? 'Verification Completed & Data Shared'
                          : transparencyData.status === 'PARTIAL_VERIFIED'
                          ? 'Partial Verification Completed'
                          : transparencyData.status === 'CONSENT_DENIED'
                          ? 'Consent Denied — 0 Department Calls'
                          : transparencyData.status === 'POLICY_DENIED'
                          ? 'Policy Denied — Data Blocked'
                          : transparencyData.status}
                      </h4>
                      <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-2xl">
                        {transparencyData.statusExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Transparency Summary Counts Card */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Transparency Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs text-slate-500 block">Requested</span>
                    <span className="text-lg font-black text-slate-800">
                      {transparencyData.summary.requestedCount}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Fields</span>
                  </div>

                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                    <span className="text-xs text-sky-700 block">Policy Allowed</span>
                    <span className="text-lg font-black text-sky-800">
                      {transparencyData.summary.allowedCount}
                    </span>
                    <span className="text-[10px] text-sky-600 block mt-0.5">Approved</span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-xs text-rose-700 block">Policy Blocked</span>
                    <span className="text-lg font-black text-rose-800">
                      {transparencyData.summary.blockedCount}
                    </span>
                    <span className="text-[10px] text-rose-600 block mt-0.5">Minimization</span>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <span className="text-xs text-indigo-700 block">Contacted</span>
                    <span className="text-lg font-black text-indigo-800">
                      {transparencyData.summary.departmentsContacted}
                    </span>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">Departments</span>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-xs text-emerald-700 block">Verified</span>
                    <span className="text-lg font-black text-emerald-800">
                      {transparencyData.summary.departmentsVerified}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Departments</span>
                  </div>

                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="text-xs text-teal-700 block">Shared</span>
                    <span className="text-lg font-black text-teal-800">
                      {transparencyData.summary.sharedCount}
                    </span>
                    <span className="text-[10px] text-teal-600 block mt-0.5">To Service</span>
                  </div>
                </div>
              </div>

              {/* SECTION: Data Minimization Flow Visualizer */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Data Minimization Pipeline Flow
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      1. Requested
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {transparencyData.consent.requestedFields.length} Fields
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                      {transparencyData.consent.requestedFields.join(', ')}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      2. Policy Engine
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Rules Evaluated
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Allowed: {transparencyData.policyDecision.allowedFields.length} | Blocked: {transparencyData.policyDecision.blockedFields.length}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      3. Verification
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {transparencyData.summary.departmentsContacted} Providers
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {transparencyData.summary.departmentsVerified} of {transparencyData.summary.departmentsContacted} Succeeded
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      4. Released Data
                    </div>
                    <div className="text-xs font-bold text-emerald-700">
                      {transparencyData.summary.sharedCount} Fields Shared
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Strictly clean & minimized
                    </div>
                  </div>
                </div>

                {/* Conceptual Clarification Box */}
                <div className="mt-3.5 p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-900 text-xs flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-bold">Citizen Rights Note:</span> Your consent gives EKSetu permission to initiate verification. It does <em>not</em> grant automatic release of every requested field. Unnecessary fields are blocked server-side by EKSetu's data minimization policies.
                  </p>
                </div>
              </div>

              {/* SECTION: What Was Shared vs What Was Blocked */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* What Was Shared */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      What Was Actually Shared ({Object.keys(transparencyData.sharedData).length})
                    </h5>
                  </div>

                  {Object.keys(transparencyData.sharedData).length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <Lock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      No data was released to the requesting service.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(transparencyData.sharedData).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800 text-[11px] block">
                              {key}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Verified by Government Source
                            </span>
                          </div>
                          <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                            {typeof val === 'number' && key.toLowerCase().includes('income')
                              ? `₹${val.toLocaleString('en-IN')}`
                              : typeof val === 'number' && key.toLowerCase().includes('percentage')
                              ? `${val}%`
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* What Was Blocked */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
                    <ShieldBan className="w-4 h-4 text-rose-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      What Was Blocked ({transparencyData.blockedData.length})
                    </h5>
                  </div>

                  {transparencyData.blockedData.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      All requested fields were permitted by policy.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {transparencyData.blockedData.map((item) => (
                        <div
                          key={item.field}
                          className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-rose-900 text-[11px]">
                              {item.field}
                            </span>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              Blocked
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                            {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Department Verification Sources */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Government Department Sources Contacted
                  </h5>
                </div>

                {transparencyData.sources.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No departments were contacted for this request.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {transparencyData.sources.map((src) => {
                      const isVerified = src.status === 'VERIFIED';
                      const isFailed = src.status === 'FAILED';

                      return (
                        <div
                          key={src.provider}
                          className={`p-3.5 rounded-xl border ${
                            isVerified
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isFailed
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              {src.providerName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFailed
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isVerified ? 'Verified' : isFailed ? 'Unavailable' : 'Not Contacted'}
                            </span>
                          </div>

                          {src.connectionType && (
                            <div className="mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                                {src.connectionType}
                              </span>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-600 font-mono">
                            Field: {src.field}
                          </div>

                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {src.statusExplanation}
                          </p>

                          {src.verifiedAt && (
                            <div className="text-[9px] text-slate-400 font-mono mt-2">
                              Verified at: {new Date(src.verifiedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: Simplified Citizen Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Simplified Citizen Activity Timeline
                  </h5>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {transparencyData.citizenTimeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white border border-sky-600" />
                      <div className="text-[10px] font-mono text-slate-400">{step.time}</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{step.title}</div>
                      <div className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
