import React, { useEffect, useState } from 'react';
import { checkGatewayHealth } from '../services/api';
import { ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkGatewayHealth()
      .then(() => setGatewayOnline(true))
      .catch(() => setGatewayOnline(false));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Government Banner */}
      <div className="bg-[#0F2642] text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wider">NATIONAL DIGITAL INFRASTRUCTURE</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">INTEROPERABILITY GATEWAY</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
            DEMO ENVIRONMENT
          </span>
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                gatewayOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : gatewayOnline === false
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 hidden sm:inline">
              Gateway {gatewayOnline === true ? 'Active' : gatewayOnline === false ? 'Offline' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div 
          onClick={() => onNavigate('/')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#0F2642] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1A4472] transition-colors">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-[#0F2642]">EKSetu</h1>
              <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded border border-sky-200">
                V1 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Government Interoperability Platform</p>
          </div>
        </div>

        <nav className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3.5 py-1.5 rounded text-sm font-medium transition-colors ${
              currentPath === '/'
                ? 'bg-slate-100 text-[#0F2642] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('/scholarship')}
            className={`px-3.5 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              currentPath === '/scholarship'
                ? 'bg-[#0F2642] text-white shadow-sm'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scholarship Portal</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
