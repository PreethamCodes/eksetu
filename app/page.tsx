import Link from 'next/link';
import { ArrowRight, Share2, KeyRound, Network, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const capabilities = [
    {
      title: 'Interoperable',
      description: 'Connect services across departments and platforms seamlessly without redundant citizen uploads.',
      icon: Network,
    },
    {
      title: 'Consent-Based',
      description: 'Information is requested strictly based on explicit, verifiable user consent at every step.',
      icon: KeyRound,
    },
    {
      title: 'Secure APIs',
      description: 'Services communicate through structured, machine-verifiable API requests with strict schemas.',
      icon: Share2,
    },
    {
      title: 'Verified Data',
      description: 'Information is directly queried and authenticated from authorized connected data providers.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Prototype Banner */}
      <section className="bg-navy-900 text-slate-200 py-2.5 px-4 text-center text-xs font-medium border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-govteal-500 animate-pulse"></span>
          <span>
            Smart India Hackathon Prototype — <strong>EkSetu Prototype V1.0</strong> (Simulated GovTech Interoperability Flow)
          </span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-govblue-50 border border-govblue-100 text-govblue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            Prototype V1.0
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-tight">
            EkSetu
          </h1>

          <p className="mt-3 text-2xl sm:text-3xl font-semibold text-govblue-700 tracking-tight">
            One Platform. Connected Services.
          </p>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed text-balance">
            Connecting government services through secure, consent-based data exchange.
            Citizens never have to repeatedly upload the same documentation across different government departments.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-base font-semibold transition-all shadow-sm hover:shadow"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-navy-900 border border-slate-300 rounded-lg text-base font-semibold transition-colors"
            >
              <span>About EkSetu</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">
              Core Interoperability Pillars
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              How EkSetu transforms inter-departmental public service delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-govblue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-govblue-50 text-govblue-700 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-navy-950 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-govblue-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active in Prototype</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prototype Disclosure Note */}
          <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 max-w-3xl mx-auto text-center shadow-sm">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Notice:</strong> This prototype is built as an architectural demonstration for the Smart India Hackathon. It demonstrates consent-based API exchange principles. It is not connected to real government backends or production citizen databases.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
