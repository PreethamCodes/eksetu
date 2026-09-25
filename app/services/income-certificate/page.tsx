'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, Database, FileText, AlertCircle } from 'lucide-react';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function IncomeCertificateServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartRequest = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'income-certificate',
          citizenId: 'CIT-001',
          purpose: 'Income Certificate Application',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initiate service request.');
      }

      const data = await res.json();
      const requestId = data.requestId;

      // Navigate to the consent page with the generated requestId
      router.push(`/services/income-certificate/consent?requestId=${requestId}`);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to create request. Please check network connection.'
      );
    }
  };

  return (
    <div className="py-12 sm:py-16">
      {isLoading && (
        <LoadingOverlay
          message="Creating service request..."
          submessage="Initializing EkSetu transaction ticket..."
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              Service Ready
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Income Certificate
            </h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
              This service requires verified citizen information from a connected government data provider.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <strong className="block font-semibold">Request Creation Failed</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Information Required */}
            <div>
              <h2 className="text-base font-bold text-navy-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-govblue-600" />
                Information Required
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Identity', note: 'Full Name & Citizen Identifier' },
                  { title: 'Address', note: 'Verified Residential State & City' },
                  { title: 'Annual Income', note: 'Assessed Annual Earnings record' },
                ].map((req) => (
                  <div
                    key={req.title}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-bold text-navy-900 block">
                        {req.title}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {req.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purpose & Data Provider Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-5 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Purpose
                </span>
                <span className="text-sm font-semibold text-navy-900 block font-mono">
                  Income Certificate Application
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Data Provider
                </span>
                <span className="text-sm font-semibold text-navy-900 flex items-center gap-1.5 font-mono">
                  <Database className="w-4 h-4 text-govblue-600" />
                  Government Data Provider — Prototype
                </span>
              </div>
            </div>

            {/* Prototype Notice */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-govblue-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-govblue-900 leading-relaxed">
                <strong>Prototype Notice:</strong> This is a prototype demonstration. No real government systems or citizen data are accessed. Clicking continue creates a demo request ticket using mock citizen identifier <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-950 font-semibold">CIT-001</code>.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <Link
                href="/services"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 text-center transition-colors"
              >
                Cancel
              </Link>

              <button
                onClick={handleStartRequest}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <span>Continue to Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
