import React from 'react';
import { GraduationCap, Landmark, Home, CheckCircle, XCircle } from 'lucide-react';

interface DepartmentResultCardProps {
  type: 'education' | 'income' | 'residence';
  departmentName: string;
  fieldLabel: string;
  fieldValue: string | number;
  status: 'VERIFIED' | 'FAILED';
  source: string;
  verifiedAt?: string;
  extraDetails?: string;
}

export const DepartmentResultCard: React.FC<DepartmentResultCardProps> = ({
  type,
  departmentName,
  fieldLabel,
  fieldValue,
  status,
  source,
  verifiedAt,
  extraDetails
}) => {
  const isVerified = status === 'VERIFIED';

  const icons = {
    education: <GraduationCap className="w-5 h-5 text-sky-700" />,
    income: <Landmark className="w-5 h-5 text-emerald-700" />,
    residence: <Home className="w-5 h-5 text-indigo-700" />
  };

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
      isVerified ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
    }`}>
      {/* Department Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-100">
            {icons[type]}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department
            </h4>
            <p className="text-sm font-bold text-[#0F2642]">
              {departmentName}
            </p>
          </div>
        </div>

        <div>
          {isVerified ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>✓ Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>✗ Unverified</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Verified Attribute */}
      <div className="py-4">
        <span className="text-xs font-semibold text-slate-500 block mb-1">
          {fieldLabel}
        </span>
        <div className="text-lg font-bold text-slate-900">
          {type === 'income' && typeof fieldValue === 'number'
            ? `₹${fieldValue.toLocaleString('en-IN')}`
            : fieldValue}
        </div>
        {extraDetails && (
          <p className="text-xs text-slate-500 mt-1">{extraDetails}</p>
        )}
      </div>

      {/* Authoritative Source Department */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 bg-slate-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium">Source:</span>
          <span className="font-semibold text-slate-800">{source}</span>
        </div>
        {verifiedAt && (
          <span className="text-slate-400 text-[11px]">
            {new Date(verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};
