import React, { useState } from 'react';
import { AuditEvent } from '../types';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-react';

interface VerificationTimelineProps {
  events?: AuditEvent[];
  requestId?: string;
}

export const VerificationTimeline: React.FC<VerificationTimelineProps> = ({
  events = [],
  requestId
}) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getEventBadgeStyle = (eventType: string, status?: string) => {
    if (eventType.includes('FAILED') || status === 'FAILED' || eventType.includes('DENIED')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
      };
    }
    if (eventType.includes('COMPLETED') || eventType.includes('VERIFIED') || eventType.includes('GRANTED') || status === 'SUCCESS') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (eventType.includes('POLICY') || eventType.includes('MINIMIZ')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
      };
    }
    if (eventType.includes('PROVIDER')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: <Database className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    return {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
      icon: <Clock className="w-3.5 h-3.5 text-sky-600" />
    };
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
        <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-sm text-slate-700">No Audit Events Found</p>
        <p className="text-xs text-slate-500 mt-1">
          No recorded audit events for this verification request.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <History className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Verification Audit Trail</h4>
            <p className="text-xs text-slate-500">
              Persistent, timestamped request lifecycle trace across gateway, policy engine, and department providers
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {requestId && (
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {requestId}
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
            {events.length} Events
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.map((event, idx) => {
            const badge = getEventBadgeStyle(event.eventType, event.status);
            const isExpanded = !!expandedIndices[idx];
            const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;
            const timeStr = new Date(event.createdAt || event.timestamp || '').toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div key={idx} className="relative group">
                {/* Node circle on vertical timeline */}
                <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${badge.dot}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${badge.bg}`}>
                        {badge.icon}
                        <span>{event.eventType}</span>
                      </span>

                      {event.provider && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                          {event.provider}
                        </span>
                      )}

                      {event.service && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                          {event.service}
                        </span>
                      )}

                      <span className="text-[11px] font-medium text-slate-500 uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {event.status}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap ml-2">
                      {timeStr}
                    </span>
                  </div>

                  {hasMetadata && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{isExpanded ? 'Hide Event Metadata' : 'View Event Metadata'}</span>
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded overflow-x-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
