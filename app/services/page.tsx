import servicesData from '@/data/services.json';
import ServiceCard from '@/components/ServiceCard';
import { ShieldCheck } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-govblue-50 text-govblue-700 text-xs font-semibold uppercase tracking-wider mb-3 border border-govblue-100">
            <ShieldCheck className="w-4 h-4" />
            Service Registry
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Government Services
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-600">
            Access connected services through EkSetu.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servicesData.map((svc) => (
            <ServiceCard
              key={svc.id}
              id={svc.id}
              name={svc.name}
              status={svc.status}
              description={svc.description}
              buttonText={svc.buttonText}
              href={svc.href}
              isAvailable={svc.isAvailable}
            />
          ))}
        </div>

        {/* Architectural Scope Callout */}
        <div className="mt-12 p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 shadow-sm">
          <div>
            <strong className="text-navy-950 font-semibold block text-sm mb-0.5">
              Smart India Hackathon Prototype Scope Notice
            </strong>
            <p>
              In V1, <strong>Income Certificate</strong> is the active live interoperability demonstration. Future services will be integrated in V2 via the standard EkSetu provider connector.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
            1 Active / 2 Planned
          </span>
        </div>
      </div>
    </div>
  );
}
