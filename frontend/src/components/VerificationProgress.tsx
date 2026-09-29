import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface VerificationProgressProps {
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, label: 'Request created', desc: 'Unique Request ID generated & logged' },
  { id: 2, label: 'Education Department contacted', desc: 'Checking academic qualifications registry' },
  { id: 3, label: 'Revenue Department contacted', desc: 'Validating annual income certificate status' },
  { id: 4, label: 'Residence Department contacted', desc: 'Verifying state domicile registry' },
  { id: 5, label: 'Data aggregated', desc: 'Harmonizing schemas and minimizing payload' },
  { id: 6, label: 'Verification complete', desc: 'Assembling verified proof for portal' }
];

export const VerificationProgress: React.FC<VerificationProgressProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          if (onComplete) onComplete();
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="bg-white rounded-xl border border-sky-200 p-6 sm:p-8 shadow-sm my-6">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 animate-spin">
          <Loader2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F2642]">
            Connecting to government data sources...
          </h3>
          <p className="text-xs text-slate-500">
            EKSetu Interoperability Layer is orchestrating department calls
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start space-x-3 p-2.5 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? 'bg-sky-50 border border-sky-200'
                  : isDone
                  ? 'bg-slate-50 border border-slate-100'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in fade-in zoom-in duration-200" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[11px] font-medium text-sky-700 flex items-center space-x-1">
                      <span>Querying</span>
                      <ArrowRight className="w-3 h-3 animate-pulse" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
