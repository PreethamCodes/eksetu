import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  subtext: string;
  role: 'citizen' | 'platform' | 'provider';
}

const steps: Step[] = [
  { id: 1, label: 'Service Request', subtext: 'Citizen Initiates', role: 'citizen' },
  { id: 2, label: 'EkSetu API', subtext: 'Interoperability Layer', role: 'platform' },
  { id: 3, label: 'Consent Verification', subtext: 'Citizen Explicit Approval', role: 'citizen' },
  { id: 4, label: 'Provider API', subtext: 'External Dept Handshake', role: 'provider' },
  { id: 5, label: 'Data Validation', subtext: 'Schema & Integrity Check', role: 'platform' },
  { id: 6, label: 'Verified Response', subtext: 'Secure Return', role: 'platform' },
];

export default function TechnicalFlow({ activeStep = 6 }: { activeStep?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-navy-950 uppercase tracking-wider">
            Interoperability Protocol Flow
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end multi-party data transaction via EkSetu gateway
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Live Flow Complete
          </span>
        </div>
      </div>

      {/* Desktop / Tablet Flow */}
      <div className="hidden lg:grid grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const isDone = idx + 1 <= activeStep;
          return (
            <div key={step.id} className="relative flex flex-col items-center text-center">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${
                    idx + 1 < activeStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                  style={{ transform: 'translateX(50%)' }}
                />
              )}

              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                  isDone
                    ? 'bg-navy-900 border-navy-900 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : step.id}
              </div>

              <div className="mt-2.5">
                <span className="block text-xs font-semibold text-navy-900 leading-tight">
                  {step.label}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {step.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Flow (Vertical) */}
      <div className="lg:hidden space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx + 1 <= activeStep;
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDone
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : step.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-navy-950">{step.label}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Step {step.id}/6</span>
                </div>
                <p className="text-[11px] text-slate-500">{step.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
