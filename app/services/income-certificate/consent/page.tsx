'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Check, ArrowLeft, ArrowRight, AlertCircle, Database, Lock } from 'lucide-react';
import LoadingOverlay from '@/components/LoadingOverlay';

function ConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRequestId = searchParams?.get('requestId') || 'EK-2026-00001';

  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGiveConsent = async () => {
    setErrorMessage(null);

    try {
      // Step 1: Processing Consent
      setLoadingStep('Processing consent...');
      const consentRes = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: queryRequestId,
          consent: true,
        }),
      });

      if (!consentRes.ok) {
        const errorData = await consentRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record citizen consent.');
      }

      // Step 2: Requesting provider data & verifying
      setLoadingStep('Requesting verified information...');
      await new Promise((r) => setTimeout(r, 400));

      setLoadingStep('Verifying information...');
      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: queryRequestId,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Verification through EkSetu interoperability layer failed.');
      }

      // Step 3: Success -> Redirect to result page
      router.push(`/result/${queryRequestId}`);
    } catch (err: unknown) {
      setLoadingStep(null);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during verification.'
      );
    }
  };

  return (
    <div className="py-12 sm:py-16">
      {loadingStep && (
        <LoadingOverlay
          message={loadingStep}
          submessage={`Connecting EkSetu with Mock Data Provider for Ticket ${queryRequestId}...`}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/services/income-certificate"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Service Requirements
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-govblue-50 text-govblue-700 border border-govblue-200 mb-2">
                <Lock className="w-3.5 h-3.5" />
                Citizen Consent Authorization
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                Review & Give Consent
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Request ID
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-navy-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block mt-0.5">
                {queryRequestId}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <strong className="block font-semibold">Consent Verification Error</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Requested Information */}
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-3">
                Requested Information
              </h2>
              <div className="space-y-2.5">
                {[
                  { name: 'Identity', desc: 'Full Name and verified citizen record' },
                  { name: 'Address', desc: 'Current residential address recorded with department' },
                  { name: 'Annual Income', desc: 'Assessed annual income for the current financial cycle' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-navy-900 mr-2">{item.name}</span>
                      <span className="text-xs text-slate-500">— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purpose & Provider Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-semibold text-slate-500 block mb-1">
                  Purpose
                </span>
                <span className="text-sm font-bold text-navy-900 font-mono">
                  Income Certificate Application
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-semibold text-slate-500 block mb-1">
                  Requested From
                </span>
                <span className="text-sm font-bold text-navy-900 flex items-center gap-1.5 font-mono">
                  <Database className="w-4 h-4 text-govblue-600" />
                  Government Data Provider — Prototype
                </span>
              </div>
            </div>

            {/* Data Usage Statement */}
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-navy-900 block font-semibold mb-1">Data Usage Policy:</strong>
              Only the information required for this service will be requested. The data will be used strictly for processing the Income Certificate Application.
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              This is a prototype representation of consent for demonstration purposes. It does not represent production-grade legal consent infrastructure.
            </p>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <Link
                href="/services/income-certificate"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 text-center transition-colors"
              >
                Cancel
              </Link>

              <button
                onClick={handleGiveConsent}
                disabled={!!loadingStep}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-govteal-500" />
                <span>Give Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-500">
          Loading consent details...
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}
