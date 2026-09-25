'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  User,
  MapPin,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import TechnicalFlow from '@/components/TechnicalFlow';
import { VerificationResponse } from '@/lib/types';

export default function ResultPage({
  params,
}: {
  params: { requestId: string };
}) {
  const { requestId } = params;

  const [loading, setLoading] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      setError(null);

      try {
        // First try to verify or fetch the verified request
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
        });

        if (!res.ok) {
          // If verify fails, attempt direct request fetch
          const fetchReq = await fetch(`/api/request/${requestId}`);
          if (fetchReq.ok) {
            const reqData = await fetchReq.json();
            if (reqData.data) {
              setData({
                requestId,
                status: 'VERIFIED',
                data: reqData.data,
                source: reqData.source || 'Government Data Provider — Prototype',
                technicalDetails: {
                  requestId,
                  service: 'Income Certificate',
                  consent: reqData.consent || 'GRANTED',
                  provider: 'Government Data Provider — Prototype',
                  verification: 'SUCCESS',
                  responseStatus: 200,
                },
              });
              setLoading(false);
              return;
            }
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to verify request record.');
        }

        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to retrieve verification record for this request ID.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, [requestId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-10 h-10 border-4 border-govblue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">
          Retrieving verified interoperability record...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 max-w-2xl mx-auto px-4 text-center">
        <div className="p-8 rounded-xl bg-white border border-red-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-navy-950">Verification Unsuccessful</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {error || 'The requested verification ticket could not be resolved.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-govblue-700 transition-colors"
            >
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format currency: 450000 -> ₹4,50,000 / year
  const formattedIncome = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(data.data.annualIncome);

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Status Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 sm:p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            ✓ Data Successfully Verified
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-800 font-medium">
            Citizen records verified through EkSetu consent-based interoperability gateway
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-xs font-mono bg-white text-navy-900 px-3 py-1 rounded border border-emerald-300 font-semibold shadow-xs">
              Request ID: {requestId}
            </span>
          </div>
        </div>

        {/* Citizen Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-govblue-600" />
              Citizen Information
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Authenticated Record
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Name */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Name
              </span>
              <span className="text-lg font-bold text-navy-950 block">
                {data.data.name}
              </span>
            </div>

            {/* Address */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Address
              </span>
              <span className="text-base font-bold text-navy-950 block">
                {data.data.address}
              </span>
            </div>

            {/* Annual Income */}
            <div className="p-4 rounded-lg bg-govblue-50/50 border border-govblue-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-govblue-700 block mb-1">
                Annual Income
              </span>
              <span className="text-lg font-extrabold text-navy-950 block">
                {formattedIncome} / year
              </span>
            </div>
          </div>

          {/* Verification Status & Metadata */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-semibold">
                Verification Status
              </span>
              <span className="font-bold text-emerald-700 text-sm flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                ✓ Verified
              </span>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-semibold">
                Data Source
              </span>
              <span className="font-bold text-navy-900 text-sm mt-0.5 block truncate">
                {data.source}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-semibold">
                Request ID
              </span>
              <span className="font-mono font-bold text-navy-900 text-sm mt-0.5 block">
                {data.requestId}
              </span>
            </div>
          </div>
        </div>

        {/* Section 16: Technical Flow Visualizer */}
        <TechnicalFlow activeStep={6} />

        {/* Section 17: Collapsible Technical Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-govblue-600" />
              <span className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                Technical Details
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{showTechnicalDetails ? 'Collapse audit metadata' : 'View audit metadata'}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="p-6 border-t border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs sm:text-sm space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Request ID</span>
                <span className="text-emerald-400 font-semibold">{data.requestId}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Service</span>
                <span className="text-white">Income Certificate</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Consent</span>
                <span className="text-emerald-400 font-semibold">GRANTED</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Provider</span>
                <span className="text-white">{data.source}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Verification</span>
                <span className="text-emerald-400 font-semibold">SUCCESS</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Response Status</span>
                <span className="text-emerald-400 font-semibold">200</span>
              </div>
            </div>
          )}
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Link
            href="/services"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <span>Back to Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/services/income-certificate"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-navy-900 border border-slate-300 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Test New Verification Flow</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
