import React from 'react';
import { ProvenanceRecord } from '../types';
import { Building2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface VerificationSourcesProps {
  provenance?: ProvenanceRecord[];
  dataReleased?: boolean;
}

export const VerificationSources: React.FC<VerificationSourcesProps> = ({
  provenance = [],
  dataReleased = true
}) => {
  if (!dataReleased || provenance.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-slate-500">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-sm text-slate-700">No Authoritative Department Data Released</p>
        <p className="text-xs text-slate-500 mt-1">
          Zero data was released to the requesting service. No departmental provenance records exist.
        </p>
      </div>
    );
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'EDUCATION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVENUE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RESIDENCE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Authoritative Data Provenance</h4>
            <p className="text-xs text-slate-500">
              Department-level attribution proving the verified origin of released fields
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
          {provenance.length} Verified Field{provenance.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="py-2.5 px-4">Released Field</th>
              <th className="py-2.5 px-4">Authoritative Provider</th>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4">Verification Status</th>
              <th className="py-2.5 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {provenance.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-900">
                  {item.field}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold text-[11px] border ${getProviderColor(item.provider)}`}>
                    {item.provider}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">
                  {item.providerName}
                </td>
                <td className="py-3 px-4">
                  {item.status === 'VERIFIED' ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>VERIFIED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>FAILED</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                  {new Date(item.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
