import Link from 'next/link';
import { ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-govblue-50 text-govblue-700 text-xs font-semibold uppercase tracking-wider mb-4 border border-govblue-100">
            <ShieldCheck className="w-4 h-4" />
            Prototype V1.0 Overview
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            About EkSetu
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Connecting government services through secure, consent-based data exchange.
          </p>
        </div>

        {/* What is EkSetu */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <section>
            <h2 className="text-xl font-bold text-navy-950 mb-3">
              What is EkSetu?
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              <strong>EkSetu</strong> is a prototype interoperability layer designed to demonstrate how government services can exchange required information through secure APIs and citizen-consent workflows.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed text-sm sm:text-base">
              In traditional public administration, citizens are often required to independently gather, photocopy, and submit certificates from one department (such as Revenue or Education) to another (such as Social Welfare). EkSetu bridges this gap by enabling authorized inter-service data verification directly upon explicit citizen consent.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* V1 Scope */}
          <section>
            <h2 className="text-xl font-bold text-navy-950 mb-4">
              V1 Prototype Scope
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              EkSetu V1 is an initial foundation prototype built for the Smart India Hackathon. It focuses on validating the core end-to-end interoperability lifecycle:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
              {[
                { step: '01', title: 'Service Discovery' },
                { step: '02', title: 'Citizen Consent' },
                { step: '03', title: 'API Request' },
                { step: '04', title: 'Provider Response' },
                { step: '05', title: 'Verification' },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center relative"
                >
                  <span className="text-[11px] font-bold text-govblue-600 uppercase font-mono">
                    Step {item.step}
                  </span>
                  <span className="text-xs font-semibold text-navy-900 mt-1">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Demonstration Notice */}
          <section className="bg-amber-50/60 border border-amber-200 rounded-lg p-5 flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-semibold block text-amber-950 mb-1">
                Prototype Demonstration Disclaimer
              </strong>
              V1 uses simulated government services and sample data for demonstration purposes. It does not access real government systems or real citizen data. Future versions (V2+) are designed to interface with production national infrastructure including API Setu and DigiLocker.
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
