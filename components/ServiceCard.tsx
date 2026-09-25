import Link from 'next/link';
import { ArrowRight, FileCheck2, Clock, CheckCircle } from 'lucide-react';

interface ServiceCardProps {
  id: string;
  name: string;
  status: string;
  description: string;
  buttonText: string;
  href: string;
  isAvailable: boolean;
}

export default function ServiceCard({
  name,
  status,
  description,
  buttonText,
  href,
  isAvailable,
}: ServiceCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between p-6 bg-white rounded-xl border transition-all ${
        isAvailable
          ? 'border-slate-300 shadow-sm hover:shadow-md hover:border-govblue-500'
          : 'border-slate-200 bg-slate-50/50 opacity-90'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isAvailable ? 'bg-govblue-50 text-govblue-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            <FileCheck2 className="w-5 h-5" />
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {status}
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                {status}
              </>
            )}
          </span>
        </div>

        <h3 className="text-lg font-bold text-navy-950 mb-2">{name}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        {isAvailable ? (
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-govblue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed border border-slate-200"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
