import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
  submessage?: string;
}

export default function LoadingOverlay({ message, submessage }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-govblue-50 flex items-center justify-center text-govblue-700">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-navy-950 tracking-tight">{message}</h3>

        {submessage ? (
          <p className="mt-2 text-sm text-slate-500">{submessage}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Communicating with EkSetu Interoperability Protocol...
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-govblue-600 animate-pulse"></span>
          <span className="w-2 h-2 rounded-full bg-govblue-600 animate-pulse [animation-delay:200ms]"></span>
          <span className="w-2 h-2 rounded-full bg-govblue-600 animate-pulse [animation-delay:400ms]"></span>
        </div>
      </div>
    </div>
  );
}
