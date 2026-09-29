import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GitCommit, CheckCircle2, XCircle } from 'lucide-react';
import { TraceStep } from '../types';

interface RequestTraceProps {
  trace: TraceStep[];
  requestId: string;
}

export const RequestTrace: React.FC<RequestTraceProps> = ({ trace, requestId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center space-x-2.5">
          <GitCommit className="w-4 h-4 text-sky-700" />
          <span className="text-sm font-bold text-[#0F2642]">
            View Request Processing Steps (Timestamped Trace)
          </span>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
            {requestId}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-sky-800 font-semibold">
          <span>{isOpen ? 'Hide Steps' : 'View Steps'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 bg-white border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-4">
            Sequential processing steps executed by EKSetu Gateway across department boundaries. <em>(Note: Lightweight execution trace; full tamper-evident cryptographic provenance is reserved for V4).</em>
          </p>

          <div className="relative border-l-2 border-sky-200 ml-4 pl-6 space-y-5">
            {trace.map((step, idx) => {
              const isFailed = step.status === 'FAILED';

              return (
                <div key={idx} className="relative group">
                  {/* Status Bullet */}
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-white ${
                    isFailed ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {isFailed ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {step.step}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm mt-0.5 ${isFailed ? 'text-rose-700 font-medium' : 'text-slate-600'}`}>
                      {step.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
